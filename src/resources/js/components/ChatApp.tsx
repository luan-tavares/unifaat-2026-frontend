import { useCallback, useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent, MouseEvent } from "react"
import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"
import type {
    ChatFeedItem,
    ChatImage,
    ChatImageError,
    ChatImageUpload,
    ChatJoin,
    ChatLeave,
    ChatMessage,
    ChatRoom,
    ChatTyping,
    OnlineUser,
} from "../types/chat"

// Os botões de reação: clicar manda o emoji como mensagem
const EMOJIS = [
    { emoji: "🔥", label: "fogo" },
    { emoji: "💣", label: "bomba" },
    { emoji: "😉", label: "piscar" },
    { emoji: "💧", label: "água" },
    { emoji: "🎉", label: "festa" },
]

// As duas salas: cada uma tem o seu feed
const ROOMS: ChatRoom[] = ["geral", "dev"]
const DEFAULT_ROOM: ChatRoom = "geral"
const EMPTY_FEED: Record<ChatRoom, ChatFeedItem[]> = { geral: [], dev: [] }

// "digitando…": no máximo 1 envio a cada 1,5 s; o aviso some depois de 3 s sem novo chat:typing
const TYPING_THROTTLE_MS = 1500
const TYPING_EXPIRES_MS = 3000

// Imagem: o limite é do arquivo original (antes do base64)
const MAX_IMAGE_BYTES = 500 * 1024

function formatTime(sentAt: number): string {
    return new Date(sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function isChatRoom(value: string | undefined): value is ChatRoom {
    return ROOMS.some(room => room === value)
}

// "ana está digitando…" / "ana e beto estão digitando…" / "ana, beto e caio estão digitando…"
function typingLabel(names: string[]): string {
    if (names.length === 0) {
        return ""
    }

    if (names.length === 1) {
        return `${names[0]} está digitando…`
    }

    const last = names[names.length - 1]
    const others = names.slice(0, -1).join(", ")

    return `${others} e ${last} estão digitando…`
}

// Quem está digitando: cada nome tem o seu setTimeout (guardado em useRef) que o tira da lista em 3 s
function useTypingNames() {
    const [typingNames, setTypingNames] = useState<string[]>([])
    const timersRef = useRef(new Map<string, number>())

    const removeTyping = useCallback((who: string) => {
        const timers = timersRef.current
        const timer = timers.get(who)

        if (timer !== undefined) {
            window.clearTimeout(timer)
            timers.delete(who)
        }

        setTypingNames(current => current.filter(typingName => typingName !== who))
    }, [])

    const addTyping = useCallback((who: string) => {
        const timers = timersRef.current
        const timer = timers.get(who)

        if (timer !== undefined) {
            window.clearTimeout(timer)
        }

        timers.set(who, window.setTimeout(() => removeTyping(who), TYPING_EXPIRES_MS))
        setTypingNames(current => (current.includes(who) ? current : [...current, who]))
    }, [removeTyping])

    const clearTyping = useCallback(() => {
        const timers = timersRef.current

        for (const timer of timers.values()) {
            window.clearTimeout(timer)
        }

        timers.clear()
        setTypingNames([])
    }, [])

    // Limpeza: ao desmontar, nenhum timer fica vivo
    useEffect(() => {
        const timers = timersRef.current

        return () => {
            for (const timer of timers.values()) {
                window.clearTimeout(timer)
            }

            timers.clear()
        }
    }, [])

    return { typingNames, addTyping, removeTyping, clearTyping }
}

// O chat (sem login): primeiro o nome, depois a sala. As mensagens chegam pelo túnel WebSocket
// (nginx → websocket → RabbitMQ) e o React só mostra o estado.
export function ChatApp() {
    const [nameDraft, setNameDraft] = useState("")
    const [name, setName] = useState("")
    const [isJoined, setIsJoined] = useState(false)
    const [room, setRoom] = useState<ChatRoom>(DEFAULT_ROOM)
    const [feed, setFeed] = useState<Record<ChatRoom, ChatFeedItem[]>>(EMPTY_FEED)
    const [text, setText] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [online, setOnline] = useState<OnlineUser[]>([])
    const [isSendingImage, setIsSendingImage] = useState(false)
    const [imageError, setImageError] = useState("")
    const { typingNames, addTyping, removeTyping, clearTyping } = useTypingNames()

    // Referências: o socket vive no heap (não renderiza), a sala atual é lida pelos listeners do socket,
    // o horário do último chat:typing segura o envio a cada tecla, e o fim da lista / o input de arquivo são elementos do HTML
    const socketRef = useRef<Socket | null>(null)
    const roomRef = useRef<ChatRoom>(DEFAULT_ROOM)
    const lastTypingSentRef = useRef(0)
    const listRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Efeito 1: depois de entrar, abre o túnel; a limpeza tira os listeners e fecha a conexão
    useEffect(() => {
        if (!isJoined) {
            return
        }

        // Só WebSocket (sem polling): o nginx reparte as conexões entre as réplicas sem precisar de sticky
        const socket = io({ transports: ["websocket"] })

        const addToFeed = (itemRoom: ChatRoom, item: ChatFeedItem) => {
            setFeed(current => ({ ...current, [itemRoom]: [...current[itemRoom], item] }))
        }

        // Ao conectar (e ao reconectar) o client diz o nome e a sala atual
        const aoConectar = () => {
            setIsConnected(true)
            socket.emit("chat:join", { name, room: roomRef.current })
        }
        const aoDesconectar = () => setIsConnected(false)
        const aoReceber = (message: ChatMessage) => {
            removeTyping(message.name)
            addToFeed(message.room, { kind: "message", message })
        }
        const aoEntrarAlguem = (join: ChatJoin) => addToFeed(join.room, { kind: "join", join })
        const aoSairAlguem = (leave: ChatLeave) => {
            removeTyping(leave.name)
            addToFeed(leave.room, { kind: "leave", leave })
        }
        const aoDigitarAlguem = (typing: ChatTyping) => {
            if (typing.name === name || typing.room !== roomRef.current) {
                return
            }

            addTyping(typing.name)
        }
        const aoReceberImagem = (image: ChatImage) => {
            if (image.name === name) {
                setIsSendingImage(false)
            }

            addToFeed(image.room, { kind: "image", image })
        }
        const aoRecusarImagem = (error: ChatImageError) => {
            setIsSendingImage(false)
            setImageError(`"${error.filename}": ${error.reason}`)
        }
        const aoReceberOnline = (users: OnlineUser[]) => setOnline(users)

        socket.on("connect", aoConectar)
        socket.on("disconnect", aoDesconectar)
        socket.on("chat:message", aoReceber)
        socket.on("chat:joined", aoEntrarAlguem)
        socket.on("chat:left", aoSairAlguem)
        socket.on("chat:typing", aoDigitarAlguem)
        socket.on("chat:image", aoReceberImagem)
        socket.on("chat:image:error", aoRecusarImagem)
        socket.on("presence:list", aoReceberOnline)

        socketRef.current = socket

        return () => {
            socket.off("connect", aoConectar)
            socket.off("disconnect", aoDesconectar)
            socket.off("chat:message", aoReceber)
            socket.off("chat:joined", aoEntrarAlguem)
            socket.off("chat:left", aoSairAlguem)
            socket.off("chat:typing", aoDigitarAlguem)
            socket.off("chat:image", aoReceberImagem)
            socket.off("chat:image:error", aoRecusarImagem)
            socket.off("presence:list", aoReceberOnline)
            socket.disconnect()
            socketRef.current = null
            setIsConnected(false)
        }
    }, [isJoined, name, addTyping, removeTyping])

    // Efeito 2: depois de a tela atualizar (mensagem nova ou troca de sala), rola só a caixa do chat até o fim
    // (scrollIntoView rolaria a janela inteira, por isso rolamos o próprio container)
    useEffect(() => {
        const list = listRef.current
        if (!list) return
        list.scrollTo({ top: list.scrollHeight, behavior: "smooth" })
    }, [feed, room])

    // Entrar: guarda o nome e liga o efeito do túnel (sempre na sala geral)
    function aoEntrar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmed = nameDraft.trim()

        if (!trimmed) {
            return
        }

        roomRef.current = DEFAULT_ROOM
        setRoom(DEFAULT_ROOM)
        setName(trimmed)
        setIsJoined(true)
    }

    // Trocar de sala: sai da antiga e entra na nova (o servidor passa a entregar só os eventos da nova)
    function handleChangeRoom(event: MouseEvent<HTMLButtonElement>) {
        const nextRoom = event.currentTarget.dataset.room

        if (!isChatRoom(nextRoom) || nextRoom === room) {
            return
        }

        socketRef.current?.emit("chat:leave", { name, room })
        socketRef.current?.emit("chat:join", { name, room: nextRoom })

        roomRef.current = nextRoom
        lastTypingSentRef.current = 0
        setRoom(nextRoom)
        setIsSendingImage(false)
        setImageError("")
        clearTyping()
    }

    // Sair da sala: avisa quem ficou e volta para a tela do nome (a limpeza do efeito fecha o túnel)
    function handleLeave() {
        socketRef.current?.emit("chat:leave", { name, room })

        roomRef.current = DEFAULT_ROOM
        lastTypingSentRef.current = 0
        setRoom(DEFAULT_ROOM)
        setFeed(EMPTY_FEED)
        setText("")
        setOnline([])
        setIsSendingImage(false)
        setImageError("")
        clearTyping()
        setIsJoined(false)
    }

    // Digitar: atualiza o campo e avisa "digitando…", mas no máximo 1 vez a cada 1,5 s (não a cada tecla)
    function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value

        setText(value)

        if (!value.trim() || !isConnected) {
            return
        }

        const now = Date.now()

        if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) {
            return
        }

        lastTypingSentRef.current = now
        socketRef.current?.emit("chat:typing", { name, room })
    }

    // Enviar: emite pelo túnel e limpa o campo; a mensagem só aparece quando VOLTA do exchange
    function aoEnviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmed = text.trim()

        if (!trimmed || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, room, text: trimmed })
        lastTypingSentRef.current = 0
        setText("")
    }

    // Clique no emoji: o handler lê qual foi (data-emoji) e emite pelo túnel, igual ao envio do texto
    function aoClicarEmoji(event: MouseEvent<HTMLButtonElement>) {
        const emoji = event.currentTarget.dataset.emoji

        if (!emoji || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, room, text: emoji })
    }

    // "📎 imagem": abre o seletor de arquivo escondido
    function handleImageClick() {
        fileInputRef.current?.click()
    }

    // Escolheu o arquivo: valida o tamanho, lê como dataURL e emite chat:image (quem processa é o worker)
    function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
        const input = event.currentTarget
        const file = input.files?.[0]

        // Limpa o input para poder escolher o mesmo arquivo de novo
        input.value = ""

        if (!file || !isConnected) {
            return
        }

        if (!file.type.startsWith("image/")) {
            setImageError(`"${file.name}" não é uma imagem.`)
            return
        }

        if (file.size > MAX_IMAGE_BYTES) {
            const sizeKb = Math.ceil(file.size / 1024)
            setImageError(`"${file.name}" tem ${sizeKb} KB: o limite é 500 KB. A imagem não foi enviada.`)
            return
        }

        setImageError("")

        const uploadRoom = room
        const reader = new FileReader()

        const aoLerArquivo = () => {
            if (typeof reader.result !== "string") {
                setImageError(`Não foi possível ler "${file.name}".`)
                return
            }

            const upload: ChatImageUpload = { name, room: uploadRoom, filename: file.name, data: reader.result }

            socketRef.current?.emit("chat:image", upload)
            setIsSendingImage(true)
        }

        reader.addEventListener("load", aoLerArquivo, { once: true })
        reader.readAsDataURL(file)
    }

    if (!isJoined) {
        return (
            <form className="card" onSubmit={aoEntrar}>
                <div className="card-body d-flex flex-column gap-3">
                    <label className="form-label mb-0" htmlFor="chat-name">Seu nome</label>
                    <input
                        id="chat-name"
                        className="form-control"
                        value={nameDraft}
                        onChange={event => setNameDraft(event.target.value)}
                        placeholder="Como você quer aparecer?"
                        maxLength={30}
                        autoFocus
                    />
                    <button className="btn btn-primary" type="submit">Entrar na sala</button>
                </div>
            </form>
        )
    }

    const statusClass = isConnected ? "text-bg-success" : "text-bg-secondary"
    const statusLabel = isConnected ? "conectado" : "conectando..."
    const roomFeed = feed[room]
    const typingText = typingLabel(typingNames)

    return (
        <>
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <div className="d-flex align-items-center gap-2">
                    <ul className="nav nav-pills">
                        {ROOMS.map(roomName => {
                            const isActive = roomName === room

                            return (
                                <li key={roomName} className="nav-item">
                                    <button
                                        type="button"
                                        className={`nav-link py-1 ${isActive ? "active" : ""}`}
                                        data-room={roomName}
                                        aria-current={isActive ? "page" : undefined}
                                        disabled={!isConnected}
                                        onClick={handleChangeRoom}
                                    >
                                        # {roomName}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                    <strong>· {name}</strong>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleLeave}>
                        Sair da sala
                    </button>
                </div>
            </div>

            <div ref={listRef} className="card-body" style={{ height: "55vh", overflowY: "auto" }}>
                {roomFeed.length === 0 && <p className="text-muted">Nenhuma mensagem em # {room} ainda. Escreva a primeira.</p>}

                {roomFeed.map(item => {
                    if (item.kind === "join") {
                        const who = item.join.name === name ? "Você" : item.join.name

                        return (
                            <p key={`join-${item.join.room}-${item.join.sentAt}-${item.join.name}`} className="text-center my-2">
                                {/* Mensagem de sistema: cor própria (verde), diferente das bolhas dos participantes */}
                                <span className="badge rounded-pill bg-success-subtle text-success-emphasis fw-normal px-3 py-2">
                                    ➜ {who} entrou na sala · {formatTime(item.join.sentAt)}
                                </span>
                            </p>
                        )
                    }

                    if (item.kind === "leave") {
                        return (
                            <p key={`leave-${item.leave.room}-${item.leave.sentAt}-${item.leave.name}`} className="text-center my-2">
                                {/* "saiu": mesma forma do "entrou", outra cor (amarelo) */}
                                <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-normal px-3 py-2">
                                    ⟵ {item.leave.name} saiu da sala · {formatTime(item.leave.sentAt)}
                                </span>
                            </p>
                        )
                    }

                    if (item.kind === "image") {
                        const image = item.image
                        const isMine = image.name === name
                        const align = isMine ? "align-items-end" : "align-items-start"

                        return (
                            <div key={`image-${image.sentAt}-${image.name}-${image.filename}`} className={`d-flex flex-column ${align} mb-2`}>
                                <small className="text-muted">
                                    {isMine ? "você" : image.name} enviou uma imagem · {formatTime(image.sentAt)}
                                </small>
                                <img
                                    src={image.thumb}
                                    alt={image.filename}
                                    title={image.filename}
                                    className="rounded-3 border"
                                    style={{ maxWidth: "min(75%, 320px)" }}
                                />
                            </div>
                        )
                    }

                    const message = item.message
                    const isMine = message.name === name
                    const align = isMine ? "align-items-end" : "align-items-start"
                    const bubble = isMine ? "bg-primary text-white" : "bg-light"
                    const isEmoji = EMOJIS.some(emojiItem => emojiItem.emoji === message.text)
                    const size = isEmoji ? "fs-1" : ""

                    return (
                        <div key={`${message.sentAt}-${message.name}-${message.text}`} className={`d-flex flex-column ${align} mb-2`}>
                            <small className="text-muted">{isMine ? "você" : message.name} · {formatTime(message.sentAt)}</small>
                            <span className={`rounded-3 px-3 py-2 ${bubble} ${size}`} style={{ maxWidth: "75%" }}>{message.text}</span>
                        </div>
                    )
                })}

            </div>

            <div className="card-footer d-flex gap-2 pb-0 border-top-0 flex-wrap">
                {EMOJIS.map(item => (
                    <button
                        key={item.emoji}
                        type="button"
                        className="btn btn-outline-secondary fs-4 py-0"
                        data-emoji={item.emoji}
                        title={item.label}
                        aria-label={item.label}
                        disabled={!isConnected}
                        onClick={aoClicarEmoji}
                    >
                        {item.emoji}
                    </button>
                ))}

                <button
                    type="button"
                    className="btn btn-outline-secondary ms-auto"
                    disabled={!isConnected || isSendingImage}
                    onClick={handleImageClick}
                >
                    📎 imagem
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleImageChange}
                />
            </div>

            <div className="card-footer border-top-0 py-1 small d-flex flex-wrap gap-2" style={{ minHeight: "1.75rem" }} aria-live="polite">
                {typingText && <span className="text-muted fst-italic">{typingText}</span>}
                {isSendingImage && <span className="text-primary">Enviando imagem… (o worker está gerando a miniatura)</span>}
                {imageError && <span className="text-danger">{imageError}</span>}
            </div>

            <form className="card-footer d-flex gap-2" onSubmit={aoEnviar}>
                <input
                    className="form-control"
                    value={text}
                    onChange={handleTextChange}
                    placeholder={`Mensagem em # ${room}...`}
                    maxLength={500}
                    autoFocus
                />
                <button className="btn btn-primary" type="submit" disabled={!isConnected}>Enviar</button>
            </form>
        </div>

        <div className="card mt-3">
            <div className="card-header"><strong>Online agora ({online.length})</strong></div>

            <ul className="list-group list-group-flush">
                {online.length === 0 && <li className="list-group-item text-muted">Ninguém por aqui ainda.</li>}

                {online.map(user => {
                    const isMe = user.name === name

                    return (
                        <li key={user.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <span>🟢 {user.name}{isMe ? " (você)" : ""}</span>
                            <code>{user.ip}</code>
                        </li>
                    )
                })}
            </ul>
        </div>
        </>
    )
}
