import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent, MouseEvent } from "react"
import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"
import type { ChatFeedItem, ChatImage, ChatJoin, ChatLeft, ChatMessage, ChatTyping, OnlineUser } from "../types/chat"

const EMOJIS = [
    { emoji: "🔥", label: "fogo" },
    { emoji: "💣", label: "bomba" },
    { emoji: "😉", label: "piscar" },
    { emoji: "💧", label: "água" },
    { emoji: "🎉", label: "festa" },
]

const ROOMS = ["geral", "dev"] as const
type Room = typeof ROOMS[number]

const MAX_IMAGE_SIZE = 500 * 1024 // 500 KB

function formatTime(sentAt: number): string {
    return new Date(sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

export function ChatApp() {
    const [nameDraft, setNameDraft] = useState("")
    const [name, setName] = useState("")
    const [isJoined, setIsJoined] = useState(false)
    const [room, setRoom] = useState<Room>("geral")
    const [feedByRoom, setFeedByRoom] = useState<Record<Room, ChatFeedItem[]>>({ geral: [], dev: [] })
    const [text, setText] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [online, setOnline] = useState<OnlineUser[]>([])
    const [typingUsers, setTypingUsers] = useState<string[]>([])
    const [imageError, setImageError] = useState("")

    const socketRef = useRef<Socket | null>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const lastTypingSentRef = useRef<number>(0)
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (!isJoined) return

        const socket = io({ transports: ["websocket"] })

        const aoConectar = () => {
            setIsConnected(true)
            socket.emit("chat:join", { name, room })
        }
        const aoDesconectar = () => setIsConnected(false)

        const aoReceberMensagem = (message: ChatMessage) => {
            setFeedByRoom((current: Record<Room, ChatFeedItem[]>) => ({
                ...current,
                [message.room]: [...(current[message.room as Room] ?? []), { kind: "message" as const, message }]
            }))
            // Limpa o "está digitando" de quem enviou
            setTypingUsers((current: string[]) => current.filter((n: string) => n !== message.name))
        }

        const aoEntrarAlguem = (join: ChatJoin) => {
            setFeedByRoom((current: Record<Room, ChatFeedItem[]>) => ({
                ...current,
                [join.room]: [...(current[join.room as Room] ?? []), { kind: "join" as const, join }]
            }))
        }

        const aoSairAlguem = (left: ChatLeft) => {
            setFeedByRoom((current: Record<Room, ChatFeedItem[]>) => ({
                ...current,
                [left.room]: [...(current[left.room as Room] ?? []), { kind: "left" as const, left }]
            }))
        }

        const aoDigitar = (typing: ChatTyping) => {
            if (typing.name === name || typing.room !== room) return
            setTypingUsers((current: string[]) => {
                if (current.includes(typing.name)) return current
                return [...current, typing.name]
            })
            clearTimeout(typingTimerRef.current)
            typingTimerRef.current = setTimeout(() => {
                setTypingUsers((current: string[]) => current.filter((n: string) => n !== typing.name))
            }, 3000)
        }

        const aoReceberImagem = (image: ChatImage) => {
            setFeedByRoom((current: Record<Room, ChatFeedItem[]>) => ({
                ...current,
                [image.room]: [...(current[image.room as Room] ?? []), { kind: "image" as const, image }]
            }))
        }

        const aoReceberOnline = (users: OnlineUser[]) => setOnline(users)

        socket.on("connect", aoConectar)
        socket.on("disconnect", aoDesconectar)
        socket.on("chat:message", aoReceberMensagem)
        socket.on("chat:joined", aoEntrarAlguem)
        socket.on("chat:left", aoSairAlguem)
        socket.on("chat:typing", aoDigitar)
        socket.on("chat:image", aoReceberImagem)
        socket.on("presence:list", aoReceberOnline)

        socketRef.current = socket

        return () => {
            clearTimeout(typingTimerRef.current)
            socket.off("connect", aoConectar)
            socket.off("disconnect", aoDesconectar)
            socket.off("chat:message", aoReceberMensagem)
            socket.off("chat:joined", aoEntrarAlguem)
            socket.off("chat:left", aoSairAlguem)
            socket.off("chat:typing", aoDigitar)
            socket.off("chat:image", aoReceberImagem)
            socket.off("presence:list", aoReceberOnline)
            socket.disconnect()
        }
    }, [isJoined, name, room])

    useEffect(() => {
        const list = listRef.current
        if (!list) return
        list.scrollTo({ top: list.scrollHeight, behavior: "smooth" })
    }, [feedByRoom, room])

    function aoEntrar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmed = nameDraft.trim()
        if (!trimmed) return
        setName(trimmed)
        setIsJoined(true)
    }

    function aoTrocarSala(novaRoom: Room) {
        if (novaRoom === room) return
        socketRef.current?.emit("chat:leave", { name, room })
        setRoom(novaRoom)
        setTypingUsers([])
        // O useEffect reabre a conexão com a nova sala via re-render
        socketRef.current?.emit("chat:join", { name, room: novaRoom })
    }

    function aoSairDaSala() {
        socketRef.current?.emit("chat:leave", { name, room })
        setIsJoined(false)
        setName("")
        setNameDraft("")
        setFeedByRoom({ geral: [], dev: [] })
        setTypingUsers([])
    }

    function aoEnviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmed = text.trim()
        if (!trimmed || !isConnected) return
        socketRef.current?.emit("chat:message", { name, room, text: trimmed })
        setText("")
    }

    function aoDigitar(event: ChangeEvent<HTMLInputElement>) {
        setText(event.target.value)
        const agora = Date.now()
        if (agora - lastTypingSentRef.current < 1500) return
        lastTypingSentRef.current = agora
        socketRef.current?.emit("chat:typing", { name, room })
    }

    function aoClicarEmoji(event: MouseEvent<HTMLButtonElement>) {
        const emoji = event.currentTarget.dataset.emoji
        if (!emoji || !isConnected) return
        socketRef.current?.emit("chat:message", { name, room, text: emoji })
    }

    function aoSelecionarImagem(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        if (!file) return

        setImageError("")

        if (file.size > MAX_IMAGE_SIZE) {
            setImageError(`Imagem muito grande (${(file.size / 1024).toFixed(0)} KB). Máximo: 500 KB.`)
            event.target.value = ""
            return
        }

        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => {
            const data = (e.target?.result) as string
            socketRef.current?.emit("chat:image", { name, room, filename: file.name, data })
        }
        reader.readAsDataURL(file)
        event.target.value = ""
    }

    function aoClicarAnexo() {
        fileInputRef.current?.click()
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
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setNameDraft(event.target.value)}
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
    const currentFeed = feedByRoom[room] ?? []

    const typingLabel = typingUsers.length === 0
        ? ""
        : typingUsers.length === 1
            ? `${typingUsers[0]} está digitando…`
            : `${typingUsers.join(" e ")} estão digitando…`

    return (
        <>
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <div className="d-flex gap-2">
                    {ROOMS.map(r => (
                        <button
                            key={r}
                            type="button"
                            className={`btn btn-sm ${r === room ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => aoTrocarSala(r)}
                        >
                            # {r}
                        </button>
                    ))}
                </div>
                <strong>{name}</strong>
                <div className="d-flex gap-2 align-items-center">
                    <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    <button type="button" className="btn btn-sm btn-outline-warning" onClick={aoSairDaSala}>
                        Sair da sala
                    </button>
                </div>
            </div>

            <div ref={listRef} className="card-body" style={{ height: "55vh", overflowY: "auto" }}>
                {currentFeed.length === 0 && <p className="text-muted">Nenhuma mensagem ainda. Escreva a primeira.</p>}

                {currentFeed.map((item: ChatFeedItem, index: number) => {
                    if (item.kind === "join") {
                        const who = item.join.name === name ? "Você" : item.join.name
                        return (
                            <p key={`join-${item.join.sentAt}-${item.join.name}-${index}`} className="text-center my-2">
                                <span className="badge rounded-pill bg-success-subtle text-success-emphasis fw-normal px-3 py-2">
                                    ➜ {who} entrou na sala · {formatTime(item.join.sentAt)}
                                </span>
                            </p>
                        )
                    }

                    if (item.kind === "left") {
                        const who = item.left.name === name ? "Você" : item.left.name
                        return (
                            <p key={`left-${item.left.sentAt}-${item.left.name}-${index}`} className="text-center my-2">
                                <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-normal px-3 py-2">
                                    ← {who} saiu da sala · {formatTime(item.left.sentAt)}
                                </span>
                            </p>
                        )
                    }

                    if (item.kind === "image") {
                        const isMine = item.image.name === name
                        const align = isMine ? "align-items-end" : "align-items-start"
                        return (
                            <div key={`img-${item.image.filename}-${index}`} className={`d-flex flex-column ${align} mb-2`}>
                                <small className="text-muted">{isMine ? "você" : item.image.name} enviou uma imagem</small>
                                <img
                                    src={item.image.thumb}
                                    alt={item.image.filename}
                                    style={{ maxWidth: "200px", maxHeight: "200px", borderRadius: "8px" }}
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
                        <div key={`${message.sentAt}-${message.name}-${message.text}-${index}`} className={`d-flex flex-column ${align} mb-2`}>
                            <small className="text-muted">{isMine ? "você" : message.name} · {formatTime(message.sentAt)}</small>
                            <span className={`rounded-3 px-3 py-2 ${bubble} ${size}`} style={{ maxWidth: "75%" }}>{message.text}</span>
                        </div>
                    )
                })}
            </div>

            {typingLabel && (
                <div className="card-footer py-1 border-top-0">
                    <small className="text-muted fst-italic">{typingLabel}</small>
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
                    disabled={!isConnected}
                    onClick={aoClicarAnexo}
                >
                    📎 imagem
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={aoSelecionarImagem}
                />
            </div>

            {imageError && (
                <div className="card-footer py-1">
                    <small className="text-danger">{imageError}</small>
                </div>
            )}

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
                {online.map((user: OnlineUser) => {
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
