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

// As duas salas do chat
const ROOMS: ChatRoom[] = ["geral", "dev"]

// Limite do upload de imagem: 500 KB (acima disso, recusa e não envia)
const MAX_IMAGE_KB = 500
const MAX_IMAGE_BYTES = MAX_IMAGE_KB * 1024

// "digitando…": no máximo 1 emissão a cada ~1,5 s; o aviso some após 3 s sem novo chat:typing
const TYPING_THROTTLE_MS = 1500
const TYPING_HIDE_MS = 3000

function formatTime(sentAt: number): string {
    return new Date(sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function formatKb(bytes: number): number {
    return Math.round(bytes / 1024)
}

// Narrowing seguro do dataset (string | undefined) para ChatRoom, sem usar "any"/"as"
function isRoom(value: string | undefined): value is ChatRoom {
    return value === "geral" || value === "dev"
}

// "ana está digitando…" / "ana e beto estão digitando…" / "ana, beto e carla estão digitando…"
function typingLabel(names: string[]): string {
    if (names.length === 0) {
        return ""
    }

    if (names.length === 1) {
        return `${names[0]} está digitando…`
    }

    const allButLast = names.slice(0, -1).join(", ")
    const last = names[names.length - 1]

    return `${allButLast} e ${last} estão digitando…`
}

// O chat (sem login): primeiro o nome; a sala começa em "geral" e troca pelas abas.
// As mensagens chegam pelo túnel WebSocket (nginx → websocket → RabbitMQ) e o React só mostra o estado.
export function ChatApp() {
    const [nameDraft, setNameDraft] = useState("")
    const [name, setName] = useState("")
    const [room, setRoom] = useState<ChatRoom>("geral")
    const [isJoined, setIsJoined] = useState(false)
    const [feed, setFeed] = useState<ChatFeedItem[]>([])
    const [text, setText] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [online, setOnline] = useState<OnlineUser[]>([])
    const [typingUsers, setTypingUsers] = useState<string[]>([])
    const [imageError, setImageError] = useState("")

    // Referências: o socket e os valores que não devem renderizar vivem no heap
    const socketRef = useRef<Socket | null>(null)
    const endRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    // A sala atual num ref: o efeito do túnel não depende dela (trocar de sala não reabre o socket),
    // mas ao (re)conectar precisamos dar join na sala certa.
    const roomRef = useRef<ChatRoom>("geral")
    // Último envio de chat:typing (throttle de ~1,5 s)
    const lastTypingSentRef = useRef(0)
    // Um timeout por pessoa que está digitando: some após 3 s sem novo aviso (com limpeza)
    const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
    // Contador para gerar uma key estável por item do feed (nunca o índice)
    const feedIdRef = useRef(0)

    // Efeito 1: depois de entrar, abre o túnel; a limpeza fecha a conexão e os timers de "digitando"
    useEffect(() => {
        if (!isJoined) {
            return
        }

        // Só WebSocket (sem polling): o nginx reparte as conexões entre as réplicas sem precisar de sticky
        const socket = io({ transports: ["websocket"] })

        const nextFeedId = (): string => {
            feedIdRef.current += 1
            return `feed-${feedIdRef.current}`
        }

        // Tira a pessoa da lista de "digitando" e limpa o timer dela (a mensagem dela chegou, por exemplo)
        const clearTyping = (who: string) => {
            const timer = typingTimersRef.current.get(who)

            if (timer) {
                clearTimeout(timer)
                typingTimersRef.current.delete(who)
            }

            setTypingUsers(current => current.filter(entry => entry !== who))
        }

        // Ao conectar (e ao reconectar) o client diz o nome e a sala atual
        const aoConectar = () => {
            setIsConnected(true)
            socket.emit("chat:join", { name, room: roomRef.current })
        }
        const aoDesconectar = () => setIsConnected(false)

        const aoReceber = (message: ChatMessage) => {
            setFeed(current => [...current, { kind: "message", id: nextFeedId(), message }])
            clearTyping(message.name)
        }
        const aoEntrarAlguem = (join: ChatJoin) => {
            setFeed(current => [...current, { kind: "join", id: nextFeedId(), join }])
        }
        const aoSairAlguem = (leave: ChatLeave) => {
            setFeed(current => [...current, { kind: "leave", id: nextFeedId(), leave }])
            clearTyping(leave.name)
        }
        const aoReceberImagem = (image: ChatImage) => {
            setFeed(current => [...current, { kind: "image", id: nextFeedId(), image }])
            clearTyping(image.name)
        }
        const aoReceberOnline = (users: OnlineUser[]) => setOnline(users)

        // "digitando…" de OUTRA pessoa (nunca de você): mostra e arma o timer de 3 s
        const aoReceberTyping = (typing: ChatTyping) => {
            const isFromMe = typing.name === name

            if (isFromMe) {
                return
            }

            setTypingUsers(current => (current.includes(typing.name) ? current : [...current, typing.name]))

            const previous = typingTimersRef.current.get(typing.name)

            if (previous) {
                clearTimeout(previous)
            }

            const timer = setTimeout(() => {
                typingTimersRef.current.delete(typing.name)
                setTypingUsers(current => current.filter(entry => entry !== typing.name))
            }, TYPING_HIDE_MS)

            typingTimersRef.current.set(typing.name, timer)
        }

        socket.on("connect", aoConectar)
        socket.on("disconnect", aoDesconectar)
        socket.on("chat:message", aoReceber)
        socket.on("chat:joined", aoEntrarAlguem)
        socket.on("chat:left", aoSairAlguem)
        socket.on("chat:typing", aoReceberTyping)
        socket.on("chat:image", aoReceberImagem)
        socket.on("presence:list", aoReceberOnline)

        socketRef.current = socket

        const timers = typingTimersRef.current

        return () => {
            socket.off("connect", aoConectar)
            socket.off("disconnect", aoDesconectar)
            socket.off("chat:message", aoReceber)
            socket.off("chat:joined", aoEntrarAlguem)
            socket.off("chat:left", aoSairAlguem)
            socket.off("chat:typing", aoReceberTyping)
            socket.off("chat:image", aoReceberImagem)
            socket.off("presence:list", aoReceberOnline)
            socket.disconnect()

            for (const timer of timers.values()) {
                clearTimeout(timer)
            }

            timers.clear()
        }
    }, [isJoined, name])

    // Efeito 2: depois de a tela atualizar com a mensagem nova, rola até o fim
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [feed])

    // Entrar: guarda o nome e liga o efeito do túnel (a sala começa em "geral")
    function handleJoin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmed = nameDraft.trim()

        if (!trimmed) {
            return
        }

        roomRef.current = "geral"
        setRoom("geral")
        setName(trimmed)
        setIsJoined(true)
    }

    // Enviar: emite pelo túnel (já com a sala) e limpa o campo; a mensagem só aparece quando VOLTA do exchange
    function handleSend(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmed = text.trim()

        if (!trimmed || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, text: trimmed, room })
        setText("")
    }

    // Avisa "estou digitando", no máximo 1 vez a cada ~1,5 s (throttle pelo horário do último envio)
    function emitTyping() {
        const now = Date.now()
        const isThrottled = now - lastTypingSentRef.current < TYPING_THROTTLE_MS

        if (isThrottled || !isConnected) {
            return
        }

        lastTypingSentRef.current = now
        socketRef.current?.emit("chat:typing", { name, room })
    }

    // Digitar no campo: atualiza o texto e dispara o chat:typing (throttled)
    function handleChangeText(event: ChangeEvent<HTMLInputElement>) {
        setText(event.target.value)
        emitTyping()
    }

    // Clique no emoji: o handler lê qual foi (data-emoji) e emite pelo túnel, igual ao envio do texto
    function handleEmoji(event: MouseEvent<HTMLButtonElement>) {
        const emoji = event.currentTarget.dataset.emoji

        if (!emoji || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, text: emoji, room })
    }

    // Trocar de sala: sai da antiga (chat:leave) e entra na nova (chat:join). O feed é filtrado por sala.
    function handleSwitchRoom(event: MouseEvent<HTMLButtonElement>) {
        const next = event.currentTarget.dataset.room

        if (!isRoom(next) || next === room || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:leave", { name, room })
        socketRef.current?.emit("chat:join", { name, room: next })

        roomRef.current = next
        setRoom(next)
        setTypingUsers([])
        setImageError("")
    }

    // Sair da sala: avisa (chat:leave) e volta para a tela do nome
    function handleLeave() {
        socketRef.current?.emit("chat:leave", { name, room })
        setIsJoined(false)
        setText("")
        setFeed([])
        setOnline([])
        setTypingUsers([])
        setImageError("")
    }

    // Botão "📎 imagem": abre o seletor de arquivo escondido
    function handleOpenFile() {
        fileInputRef.current?.click()
    }

    // Seleção da imagem: valida o tamanho (≤ 500 KB), lê com FileReader e emite chat:image com o dataURL
    function handlePickImage(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        event.target.value = ""

        if (!file || !isConnected) {
            return
        }

        const isTooBig = file.size > MAX_IMAGE_BYTES

        if (isTooBig) {
            setImageError(`"${file.name}" tem ${formatKb(file.size)} KB. O limite é ${MAX_IMAGE_KB} KB.`)
            return
        }

        setImageError("")

        const reader = new FileReader()

        reader.onload = () => {
            const data = String(reader.result ?? "")

            if (!data) {
                return
            }

            socketRef.current?.emit("chat:image", { name, room, filename: file.name, data })
        }

        reader.readAsDataURL(file)
    }

    // A sala de cada item do feed, para filtrar o que aparece na sala atual
    function feedRoom(item: ChatFeedItem): ChatRoom {
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

    // Desenha um item do feed (mensagem, entrou, saiu ou imagem), com key estável (item.id)
    function renderFeedItem(item: ChatFeedItem) {
        if (item.kind === "join") {
            const who = item.join.name === name ? "Você" : item.join.name

            return (
                <p key={item.id} className="text-center my-2">
                    {/* Mensagem de sistema "entrou": cor própria (verde) */}
                    <span className="badge rounded-pill bg-success-subtle text-success-emphasis fw-normal px-3 py-2">
                        ➜ {who} entrou na sala · {formatTime(item.join.sentAt)}
                    </span>
                </p>
            )
        }

        if (item.kind === "leave") {
            const who = item.leave.name === name ? "Você" : item.leave.name

            return (
                <p key={item.id} className="text-center my-2">
                    {/* Mensagem de sistema "saiu": cor DIFERENTE da de "entrou" (âmbar) */}
                    <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-normal px-3 py-2">
                        ← {who} saiu da sala · {formatTime(item.leave.sentAt)}
                    </span>
                </p>
            )
        }

        if (item.kind === "image") {
            const image = item.image
            const isMine = image.name === name
            const align = isMine ? "align-items-end" : "align-items-start"
            const author = isMine ? "você" : image.name

            return (
                <div key={item.id} className={`d-flex flex-column ${align} mb-2`}>
                    <small className="text-muted">{author} · {formatTime(image.sentAt)}</small>
                    <span className="rounded-3 px-2 py-2 bg-light" style={{ maxWidth: "75%" }}>
                        <img
                            src={image.thumb}
                            alt={image.filename}
                            className="rounded d-block"
                            style={{ maxWidth: "220px", height: "auto" }}
                        />
                        <small className="text-muted d-block mt-1">{author} enviou uma imagem</small>
                    </span>
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
            <div key={item.id} className={`d-flex flex-column ${align} mb-2`}>
                <small className="text-muted">{isMine ? "você" : message.name} · {formatTime(message.sentAt)}</small>
                <span className={`rounded-3 px-3 py-2 ${bubble} ${size}`} style={{ maxWidth: "75%" }}>{message.text}</span>
            </div>
        )
    }

    if (!isJoined) {
        return (
            <form className="card" onSubmit={handleJoin}>
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
    const roomFeed = feed.filter(item => feedRoom(item) === room)
    const typingText = typingLabel(typingUsers)

    return (
        <>
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <strong># {room} · {name}</strong>
                <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleLeave}>Sair da sala</button>
                </div>
            </div>

            <ul className="nav nav-tabs card-header-tabs px-3 pt-2 bg-body-tertiary">
                {ROOMS.map(item => {
                    const isActive = item === room
                    const linkClass = isActive ? "nav-link active" : "nav-link"

                    return (
                        <li className="nav-item" key={item}>
                            <button type="button" className={linkClass} data-room={item} onClick={handleSwitchRoom}>
                                # {item}
                            </button>
                        </li>
                    )
                })}
            </ul>

            <div className="card-body" style={{ height: "55vh", overflowY: "auto" }}>
                {roomFeed.length === 0 && <p className="text-muted">Nenhuma mensagem ainda. Escreva a primeira.</p>}

                {roomFeed.map(renderFeedItem)}

                <div ref={endRef} />
            </div>

            {typingText && (
                <div className="px-3 pt-2 text-muted fst-italic small">{typingText}</div>
            )}

            {imageError && (
                <div className="alert alert-danger mx-3 mt-2 mb-0 py-2 small" role="alert">{imageError}</div>
            )}

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
                        onClick={handleEmoji}
                    >
                        {item.emoji}
                    </button>
                ))}

                <button
                    type="button"
                    className="btn btn-outline-primary ms-auto"
                    disabled={!isConnected}
                    onClick={handleOpenFile}
                >
                    📎 imagem
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handlePickImage}
                />
            </div>

            <form className="card-footer d-flex gap-2" onSubmit={handleSend}>
                <input
                    className="form-control"
                    value={text}
                    onChange={handleChangeText}
                    placeholder="Digite uma mensagem..."
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
