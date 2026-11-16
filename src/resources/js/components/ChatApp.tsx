import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent, MouseEvent } from "react"
import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"
import type {
    ChatFeedItem,
    ChatImage,
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

// As duas salas
const ROOMS: { room: ChatRoom; label: string }[] = [
    { room: "geral", label: "# geral" },
    { room: "dev", label: "# dev" },
]

const TYPING_INTERVAL_MS = 1500 // "digitando" sai no máximo 1 vez a cada 1,5 s
const TYPING_EXPIRES_MS = 3000 // o aviso some sozinho depois de 3 s sem novo chat:typing
const MAX_IMAGE_BYTES = 500 * 1024 // limite da imagem: 500 KB

function formatTime(sentAt: number): string {
    return new Date(sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function isChatRoom(value: string | undefined): value is ChatRoom {
    return value === "geral" || value === "dev"
}

// Cada aviso de "digitando" é identificado por sala + nome
function typingKey(room: ChatRoom, name: string): string {
    return `${room}:${name}`
}

// A sala de cada item da lista (o feed guarda tudo; a tela mostra só a sala escolhida)
function roomOf(item: ChatFeedItem): ChatRoom {
    if (item.kind === "message") {
        return item.message.room
    }

    if (item.kind === "join") {
        return item.join.room
    }

    if (item.kind === "leave") {
        return item.leave.room
    }

    return item.image.room
}

// "ana está digitando…", "ana e beto estão digitando…", "ana, beto e carla estão digitando…"
function formatTypers(names: string[]): string {
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

// O chat (sem login): primeiro o nome, depois a sala. As mensagens chegam pelo túnel WebSocket
// (nginx → websocket → RabbitMQ) e o React só mostra o estado.
export function ChatApp() {
    const [nameDraft, setNameDraft] = useState("")
    const [name, setName] = useState("")
    const [isJoined, setIsJoined] = useState(false)
    const [room, setRoom] = useState<ChatRoom>("geral")
    const [feed, setFeed] = useState<ChatFeedItem[]>([])
    const [text, setText] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [online, setOnline] = useState<OnlineUser[]>([])
    const [typers, setTypers] = useState<ChatTyping[]>([])
    const [imageError, setImageError] = useState<string | null>(null)
    const [isSending, setIsSending] = useState(false)

    // Referências: o socket vive no heap (não renderiza) e o fim da lista é um elemento do HTML
    const socketRef = useRef<Socket | null>(null)
    const endRef = useRef<HTMLDivElement>(null)
    const fileRef = useRef<HTMLInputElement>(null)
    // Dados de bastidor (não aparecem na tela): a sala atual para o "connect", a hora do último "digitando"
    // enviado e os timers que apagam o aviso de cada pessoa
    const roomRef = useRef<ChatRoom>("geral")
    const lastTypingRef = useRef<number>(0)
    const timersRef = useRef<Map<string, number>>(new Map())

    // Efeito 1: depois de entrar na sala, abre o túnel; a limpeza fecha a conexão e cancela os timers
    useEffect(() => {
        if (!isJoined) {
            return
        }

        const timers = timersRef.current

        // Só WebSocket (sem polling): o nginx reparte as conexões entre as réplicas sem precisar de sticky
        const socket = io({ transports: ["websocket"] })

        // Tira o aviso "digitando" de uma pessoa (e o timer dela)
        const removeTyper = (key: string) => {
            const timer = timers.get(key)

            if (timer !== undefined) {
                window.clearTimeout(timer)
                timers.delete(key)
            }

            setTypers(current => current.filter(item => typingKey(item.room, item.name) !== key))
        }

        // Ao conectar (e ao reconectar) o client diz o nome e a sala: o servidor guarda no socket e publica a presença
        const aoConectar = () => {
            setIsConnected(true)
            socket.emit("chat:join", { name, room: roomRef.current })
        }
        const aoDesconectar = () => setIsConnected(false)
        const aoReceber = (message: ChatMessage) => {
            // A mensagem de quem estava digitando faz o aviso sumir na hora
            removeTyper(typingKey(message.room, message.name))
            setFeed(current => [...current, { kind: "message", message }])
        }
        const aoEntrarAlguem = (join: ChatJoin) => setFeed(current => [...current, { kind: "join", join }])
        const aoSairAlguem = (leave: ChatLeave) => setFeed(current => [...current, { kind: "leave", leave }])
        const aoReceberImagem = (image: ChatImage) => {
            removeTyper(typingKey(image.room, image.name))
            setFeed(current => [...current, { kind: "image", image }])
        }
        const aoReceberOnline = (users: OnlineUser[]) => setOnline(users)
        const aoDigitarAlguem = (typing: ChatTyping) => {
            // Nunca mostra o "digitando" de você mesmo
            if (typing.name === name) {
                return
            }

            const key = typingKey(typing.room, typing.name)
            const previous = timers.get(key)

            if (previous !== undefined) {
                window.clearTimeout(previous)
            }

            // Novo chat:typing reinicia a contagem de 3 s
            timers.set(key, window.setTimeout(() => removeTyper(key), TYPING_EXPIRES_MS))

            setTypers(current => {
                const alreadyShown = current.some(item => typingKey(item.room, item.name) === key)

                if (alreadyShown) {
                    return current
                }

                return [...current, typing]
            })
        }

        socket.on("connect", aoConectar)
        socket.on("disconnect", aoDesconectar)
        socket.on("chat:message", aoReceber)
        socket.on("chat:joined", aoEntrarAlguem)
        socket.on("chat:left", aoSairAlguem)
        socket.on("chat:image", aoReceberImagem)
        socket.on("chat:typing", aoDigitarAlguem)
        socket.on("presence:list", aoReceberOnline)

        socketRef.current = socket

        return () => {
            socket.off("connect", aoConectar)
            socket.off("disconnect", aoDesconectar)
            socket.off("chat:message", aoReceber)
            socket.off("chat:joined", aoEntrarAlguem)
            socket.off("chat:left", aoSairAlguem)
            socket.off("chat:image", aoReceberImagem)
            socket.off("chat:typing", aoDigitarAlguem)
            socket.off("presence:list", aoReceberOnline)
            socket.disconnect()

            timers.forEach(timer => window.clearTimeout(timer))
            timers.clear()
        }
    }, [isJoined, name])

    // Efeito 2: depois de a tela atualizar com a mensagem nova, rola até o fim
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [feed, room])

    // Entrar: guarda o nome e liga o efeito do túnel
    function aoEntrar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmed = nameDraft.trim()

        if (!trimmed) {
            return
        }

        setName(trimmed)
        setIsJoined(true)
    }

    // Enviar: emite pelo túnel e limpa o campo; a mensagem só aparece quando VOLTA do exchange
    function aoEnviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmed = text.trim()

        if (!trimmed || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, room, text: trimmed })
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

    // Digitar: atualiza o campo e avisa "digitando", no máximo 1 vez a cada 1,5 s (nunca a cada tecla)
    function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value

        setText(value)

        if (!value.trim() || !isConnected) {
            return
        }

        const now = Date.now()

        if (now - lastTypingRef.current < TYPING_INTERVAL_MS) {
            return
        }

        lastTypingRef.current = now
        socketRef.current?.emit("chat:typing", { name, room })
    }

    // Trocar de sala: sai da antiga (chat:leave) e entra na nova (chat:join)
    function handleChangeRoom(event: MouseEvent<HTMLButtonElement>) {
        const nextRoom = event.currentTarget.dataset.room

        if (!isChatRoom(nextRoom) || nextRoom === room) {
            return
        }

        socketRef.current?.emit("chat:leave", { name, room })
        socketRef.current?.emit("chat:join", { name, room: nextRoom })

        roomRef.current = nextRoom
        setRoom(nextRoom)
    }

    // Sair da sala: avisa o servidor e volta para a tela do nome (o efeito do túnel fecha a conexão)
    function handleLeave() {
        socketRef.current?.emit("chat:leave", { name, room })

        roomRef.current = "geral"
        setIsJoined(false)
        setIsConnected(false)
        setRoom("geral")
        setFeed([])
        setTypers([])
        setOnline([])
        setText("")
        setImageError(null)
    }

    // O botão bonito aciona o <input type="file"> escondido
    function handleChooseImage() {
        setImageError(null)
        fileRef.current?.click()
    }

    // Imagem escolhida: recusa acima de 500 KB; senão lê como dataURL (base64) e emite chat:image
    function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
        const input = event.currentTarget
        const file = input.files?.[0]

        // Permite escolher o mesmo arquivo de novo depois
        input.value = ""

        if (!file) {
            return
        }

        if (!file.type.startsWith("image/")) {
            setImageError("Escolha um arquivo de imagem.")
            return
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setImageError("A imagem passa de 500 KB. Escolha uma menor.")
            return
        }

        const reader = new FileReader()

        const handleReaderLoad = () => {
            setIsSending(false)

            if (typeof reader.result !== "string") {
                setImageError("Não foi possível ler a imagem.")
                return
            }

            socketRef.current?.emit("chat:image", { name, room, filename: file.name, data: reader.result })
        }
        const handleReaderError = () => {
            setIsSending(false)
            setImageError("Não foi possível ler a imagem.")
        }

        reader.onload = handleReaderLoad
        reader.onerror = handleReaderError

        setImageError(null)
        setIsSending(true)
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
    const visibleFeed = feed.filter(item => roomOf(item) === room)
    const typingNames = typers.filter(item => item.room === room).map(item => item.name)
    const typingLabel = formatTypers(typingNames)

    return (
        <>
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center gap-2">
                <strong>Sala {room} · {name}</strong>
                <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    <button type="button" className="btn btn-outline-danger btn-sm" onClick={handleLeave}>
                        Sair da sala
                    </button>
                </div>
            </div>

            <div className="card-header d-flex gap-2 border-top-0">
                {ROOMS.map(item => {
                    const isCurrent = item.room === room
                    const variant = isCurrent ? "btn-primary" : "btn-outline-primary"

                    return (
                        <button
                            key={item.room}
                            type="button"
                            className={`btn btn-sm ${variant}`}
                            data-room={item.room}
                            aria-pressed={isCurrent}
                            onClick={handleChangeRoom}
                        >
                            {item.label}
                        </button>
                    )
                })}
            </div>

            <div className="card-body" style={{ height: "55vh", overflowY: "auto" }}>
                {visibleFeed.length === 0 && <p className="text-muted">Nenhuma mensagem ainda. Escreva a primeira.</p>}

                {visibleFeed.map(item => {
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
                                {/* Saída: outra cor (amarelo), para não confundir com o "entrou" (verde) */}
                                <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-normal px-3 py-2">
                                    ⬅ {item.leave.name} saiu da sala · {formatTime(item.leave.sentAt)}
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
                                <img src={image.thumb} alt={image.filename} className="rounded-3 mt-1" style={{ maxWidth: 200 }} />
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

                <div ref={endRef} />
            </div>

            <div className="card-footer d-flex gap-2 pb-0 border-top-0">
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
            </div>

            {/* Aviso "fulano está digitando…" acima do campo: a altura fica reservada para a tela não pular */}
            <div className="card-footer border-top-0 py-1 small text-muted fst-italic" style={{ minHeight: "2rem" }}>
                {typingLabel}
            </div>

            <form className="card-footer d-flex gap-2" onSubmit={aoEnviar}>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleImageChange}
                />
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleChooseImage}
                    disabled={!isConnected || isSending}
                >
                    📎 imagem
                </button>
                <input
                    className="form-control"
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Digite uma mensagem..."
                    maxLength={500}
                    autoFocus
                />
                <button className="btn btn-primary" type="submit" disabled={!isConnected}>Enviar</button>
            </form>

            {imageError && <div className="card-footer text-danger py-2" role="alert">{imageError}</div>}
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
