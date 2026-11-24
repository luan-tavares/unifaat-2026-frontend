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
import { LoadButton } from "./LoadButton"

const EMOJIS = [
    { emoji: "🔥", label: "fogo" },
    { emoji: "💣", label: "bomba" },
    { emoji: "😉", label: "piscar" },
    { emoji: "💧", label: "água" },
    { emoji: "🎉", label: "festa" },
]

const ROOMS: ChatRoom[] = ["geral", "dev"]

const TYPING_THROTTLE_MS = 1500
const TYPING_TIMEOUT_MS = 3000
const MAX_IMAGE_BYTES = 500 * 1024

function formatTime(sentAt: number): string {
    return new Date(sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function buildTypingLabel(names: string[]): string {
    if (names.length === 1) return `${names[0]} está digitando…`
    const last = names[names.length - 1]
    const rest = names.slice(0, -1).join(", ")
    return `${rest} e ${last} estão digitando…`
}

export function ChatApp() {
    const [nameDraft, setNameDraft] = useState("")
    const [name, setName] = useState("")
    const [isJoined, setIsJoined] = useState(false)
    const [room, setRoom] = useState<ChatRoom>("geral")
    const [feedByRoom, setFeedByRoom] = useState<Record<ChatRoom, ChatFeedItem[]>>({ geral: [], dev: [] })
    const [text, setText] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [online, setOnline] = useState<OnlineUser[]>([])
    const [typingNames, setTypingNames] = useState<string[]>([])
    const [imageError, setImageError] = useState("")
    const [isSending, setIsSending] = useState(false)

    const socketRef = useRef<Socket | null>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const lastTypingRef = useRef<number>(0)
    const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

    // Efeito 1: abre o túnel ao entrar; limpeza fecha a conexão
    useEffect(() => {
        if (!isJoined) {
            return
        }

        const socket = io({ transports: ["websocket"] })

        const aoConectar = () => {
            setIsConnected(true)
            socket.emit("chat:join", { name, room })
        }
        const aoDesconectar = () => setIsConnected(false)

        const aoReceberMensagem = (message: ChatMessage) => {
            if (message.room !== room) return
            // Some o "digitando" de quem acabou de enviar
            clearTypingTimer(message.name)
            setTypingNames(prev => prev.filter(n => n !== message.name))
            setFeedByRoom(prev => ({
                ...prev,
                [message.room]: [...prev[message.room as ChatRoom], { kind: "message", message }],
            }))
        }

        const aoAlguemEntrar = (join: ChatJoin) => {
            setFeedByRoom(prev => ({
                ...prev,
                [join.room]: [...prev[join.room as ChatRoom], { kind: "join", join }],
            }))
        }

        const aoAlguemSair = (leave: ChatLeave) => {
            setFeedByRoom(prev => ({
                ...prev,
                [leave.room]: [...prev[leave.room as ChatRoom], { kind: "leave", leave }],
            }))
        }

        const aoDigitando = (typing: ChatTyping) => {
            if (typing.name === name) return
            if (typing.room !== room) return

            clearTypingTimer(typing.name)
            setTypingNames(prev => prev.includes(typing.name) ? prev : [...prev, typing.name])

            const timer = setTimeout(() => {
                setTypingNames(prev => prev.filter(n => n !== typing.name))
            }, TYPING_TIMEOUT_MS)

            typingTimersRef.current[typing.name] = timer
        }

        const aoReceberImagem = (image: ChatImage) => {
            if (image.room !== room) return
            setFeedByRoom(prev => ({
                ...prev,
                [image.room]: [...prev[image.room as ChatRoom], { kind: "image", image }],
            }))
            setIsSending(false)
        }

        const aoReceberOnline = (users: OnlineUser[]) => setOnline(users)

        socket.on("connect", aoConectar)
        socket.on("disconnect", aoDesconectar)
        socket.on("chat:message", aoReceberMensagem)
        socket.on("chat:joined", aoAlguemEntrar)
        socket.on("chat:left", aoAlguemSair)
        socket.on("chat:typing", aoDigitando)
        socket.on("chat:image", aoReceberImagem)
        socket.on("presence:list", aoReceberOnline)

        socketRef.current = socket

        return () => {
            socket.off("connect", aoConectar)
            socket.off("disconnect", aoDesconectar)
            socket.off("chat:message", aoReceberMensagem)
            socket.off("chat:joined", aoAlguemEntrar)
            socket.off("chat:left", aoAlguemSair)
            socket.off("chat:typing", aoDigitando)
            socket.off("chat:image", aoReceberImagem)
            socket.off("presence:list", aoReceberOnline)
            socket.disconnect()

            // Limpa todos os timers de digitando
            for (const timer of Object.values(typingTimersRef.current)) {
                clearTimeout(timer)
            }
            typingTimersRef.current = {}
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isJoined, name])

    // Efeito 2: rola o chat até o fim quando o feed muda
    useEffect(() => {
        const list = listRef.current
        if (!list) return
        list.scrollTo({ top: list.scrollHeight, behavior: "smooth" })
    }, [feedByRoom, room])

    function clearTypingTimer(typingName: string) {
        clearTimeout(typingTimersRef.current[typingName])
        delete typingTimersRef.current[typingName]
    }

    function aoEntrar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmed = nameDraft.trim()
        if (!trimmed) return
        setName(trimmed)
        setIsJoined(true)
    }

    function aoTrocarSala(novaRoom: ChatRoom) {
        if (novaRoom === room) return
        socketRef.current?.emit("chat:leave", { name, room })
        setRoom(novaRoom)
        setTypingNames([])
        socketRef.current?.emit("chat:join", { name, room: novaRoom })
    }

    function aoSairDaSala() {
        socketRef.current?.emit("chat:leave", { name, room })
        setIsJoined(false)
        setRoom("geral")
        setTypingNames([])
        setFeedByRoom({ geral: [], dev: [] })
        setText("")
        setOnline([])
    }

    function aoEnviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmed = text.trim()
        if (!trimmed || !isConnected) return
        socketRef.current?.emit("chat:message", { name, text: trimmed, room })
        setText("")
    }

    function aoDigitar(event: ChangeEvent<HTMLInputElement>) {
        setText(event.target.value)
        const now = Date.now()
        if (now - lastTypingRef.current < TYPING_THROTTLE_MS) return
        lastTypingRef.current = now
        socketRef.current?.emit("chat:typing", { name, room })
    }

    function aoClicarEmoji(event: MouseEvent<HTMLButtonElement>) {
        const emoji = event.currentTarget.dataset.emoji
        if (!emoji || !isConnected) return
        socketRef.current?.emit("chat:message", { name, text: emoji, room })
    }

    function aoClicarAnexo() {
        fileInputRef.current?.click()
    }

    function aoSelecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        event.target.value = ""

        if (!file) return

        if (file.size > MAX_IMAGE_BYTES) {
            setImageError("Imagem muito grande: máximo 500 KB.")
            return
        }

        setImageError("")
        setIsSending(true)

        const reader = new FileReader()

        reader.onload = () => {
            const data = reader.result as string
            socketRef.current?.emit("chat:image", { name, room, filename: file.name, data })
        }

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
    const feed = feedByRoom[room]

    return (
        <>
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
                {/* Abas de salas */}
                <div className="d-flex gap-2">
                    {ROOMS.map(r => (
                        <button
                            key={r}
                            type="button"
                            className={`btn btn-sm ${room === r ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => aoTrocarSala(r)}
                            disabled={!isConnected}
                        >
                            # {r}
                        </button>
                    ))}
                </div>

                <div className="d-flex align-items-center gap-2">
                    <span className="fw-semibold">{name}</span>
                    <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-warning"
                        onClick={aoSairDaSala}
                        disabled={!isConnected}
                    >
                        Sair da sala
                    </button>
                </div>
            </div>

            <div ref={listRef} className="card-body" style={{ height: "55vh", overflowY: "auto" }}>
                {feed.length === 0 && <p className="text-muted">Nenhuma mensagem ainda. Escreva a primeira.</p>}

                {feed.map(item => {
                    if (item.kind === "join") {
                        const who = item.join.name === name ? "Você" : item.join.name
                        return (
                            <p key={`join-${item.join.sentAt}-${item.join.name}`} className="text-center my-2">
                                <span className="badge rounded-pill bg-success-subtle text-success-emphasis fw-normal px-3 py-2">
                                    ➜ {who} entrou na sala · {formatTime(item.join.sentAt)}
                                </span>
                            </p>
                        )
                    }

                    if (item.kind === "leave") {
                        const who = item.leave.name === name ? "Você" : item.leave.name
                        return (
                            <p key={`leave-${item.leave.sentAt}-${item.leave.name}`} className="text-center my-2">
                                <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-normal px-3 py-2">
                                    ← {who} saiu da sala · {formatTime(item.leave.sentAt)}
                                </span>
                            </p>
                        )
                    }

                    if (item.kind === "image") {
                        const isMine = item.image.name === name
                        const align = isMine ? "align-items-end" : "align-items-start"
                        return (
                            <div key={`img-${item.image.filename}-${item.image.name}`} className={`d-flex flex-column ${align} mb-2`}>
                                <small className="text-muted">{isMine ? "você" : item.image.name} · enviou uma imagem</small>
                                <img
                                    src={item.image.thumb}
                                    alt={item.image.filename}
                                    className="rounded-3 mt-1"
                                    style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "cover" }}
                                />
                            </div>
                        )
                    }

                    const message = item.message
                    const isMine = message.name === name
                    const align = isMine ? "align-items-end" : "align-items-start"
                    const bubble = isMine ? "bg-primary text-white" : "bg-light"
                    const isEmoji = EMOJIS.some(e => e.emoji === message.text)
                    const size = isEmoji ? "fs-1" : ""

                    return (
                        <div key={`${message.sentAt}-${message.name}-${message.text}`} className={`d-flex flex-column ${align} mb-2`}>
                            <small className="text-muted">{isMine ? "você" : message.name} · {formatTime(message.sentAt)}</small>
                            <span className={`rounded-3 px-3 py-2 ${bubble} ${size}`} style={{ maxWidth: "75%" }}>{message.text}</span>
                        </div>
                    )
                })}
            </div>

            {/* Aviso de quem está digitando */}
            {typingNames.length > 0 && (
                <div className="card-footer py-1 border-top-0">
                    <small className="text-muted fst-italic">{buildTypingLabel(typingNames)}</small>
                </div>
            )}

            {imageError && (
                <div className="card-footer py-1 border-top-0">
                    <small className="text-danger">{imageError}</small>
                </div>
            )}

            {isSending && (
                <div className="card-footer py-1 border-top-0">
                    <small className="text-muted fst-italic">Enviando imagem…</small>
                </div>
            )}

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

                <button
                    type="button"
                    className="btn btn-outline-secondary ms-auto"
                    title="Enviar imagem (máx. 500 KB)"
                    aria-label="Enviar imagem"
                    disabled={!isConnected || isSending}
                    onClick={aoClicarAnexo}
                >
                    📎 imagem
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={aoSelecionarArquivo}
                />
            </div>

            <form className="card-footer d-flex gap-2" onSubmit={aoEnviar}>
                <input
                    className="form-control"
                    value={text}
                    onChange={aoDigitar}
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

        <LoadButton />
        </>
    )
}
