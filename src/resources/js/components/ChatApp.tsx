import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent, MouseEvent } from "react"
import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"
import type {
    ChatFeedItem,
    ChatImage,
    ChatImageProcessing,
    ChatJoin,
    ChatLeave,
    ChatMessage,
    ChatTyping,
    OnlineUser,
    Room,
} from "../types/chat"
import { LoadButton } from "./LoadButton"

const EMOJIS = [
    { emoji: "🔥", label: "fogo" },
    { emoji: "💣", label: "bomba" },
    { emoji: "😉", label: "piscar" },
    { emoji: "💧", label: "água" },
    { emoji: "🎉", label: "festa" },
]

const ROOMS: Room[] = ["geral", "dev"]

// Throttle de digitação: no máximo 1 emissão a cada TYPING_THROTTLE_MS
const TYPING_THROTTLE_MS = 1500
// O aviso "fulano está digitando" some após TYPING_EXPIRE_MS sem novo evento
const TYPING_EXPIRE_MS = 3000
// Tamanho máximo do arquivo de imagem
const MAX_IMAGE_BYTES = 500 * 1024

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
    // Mapa nome → texto do aviso de digitação ativo nesta sala
    const [typingNames, setTypingNames] = useState<Record<string, boolean>>({})
    const [imageError, setImageError] = useState<string | null>(null)

    const socketRef = useRef<Socket | null>(null)
    const listRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Throttle de digitação: guarda o timestamp do último envio
    const lastTypingSentRef = useRef<number>(0)
    // Timers de expiração por nome: { [name]: timeoutId }
    const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

    // Efeito 1: abre o túnel ao entrar na sala; limpeza fecha a conexão
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
            setFeedByRoom(prev => ({
                ...prev,
                [message.room]: [...prev[message.room as Room], { kind: "message", message }],
            }))
            // Mensagem da pessoa limpa o aviso de digitação dela
            setTypingNames(prev => {
                const next = { ...prev }
                delete next[message.name]
                return next
            })
        }

        const aoEntrarAlguem = (join: ChatJoin) => {
            setFeedByRoom(prev => ({
                ...prev,
                [join.room]: [...prev[join.room as Room], { kind: "join", join }],
            }))
        }

        const aoSairAlguem = (leave: ChatLeave) => {
            setFeedByRoom(prev => ({
                ...prev,
                [leave.room]: [...prev[leave.room as Room], { kind: "leave", leave }],
            }))
        }

        const aoReceberDigitando = (typing: ChatTyping) => {
            // Nunca mostra o próprio aviso para si mesmo
            if (typing.name === name || typing.room !== room) {
                return
            }

            setTypingNames(prev => ({ ...prev, [typing.name]: true }))

            // Cancela o timer anterior e cria um novo para expirar em TYPING_EXPIRE_MS
            clearTimeout(typingTimersRef.current[typing.name])
            typingTimersRef.current[typing.name] = setTimeout(() => {
                setTypingNames(prev => {
                    const next = { ...prev }
                    delete next[typing.name]
                    return next
                })
            }, TYPING_EXPIRE_MS)
        }

        const aoReceberImagem = (image: ChatImage) => {
            setFeedByRoom(prev => ({
                ...prev,
                [image.room]: [...prev[image.room as Room], { kind: "image", image }],
            }))
        }

        const aoReceberImagemProcessando = (processing: ChatImageProcessing) => {
            setFeedByRoom(prev => ({
                ...prev,
                [processing.room]: [
                    ...prev[processing.room as Room],
                    { kind: "image:processing", processing },
                ],
            }))
        }

        const aoReceberOnline = (users: OnlineUser[]) => setOnline(users)

        socket.on("connect", aoConectar)
        socket.on("disconnect", aoDesconectar)
        socket.on("chat:message", aoReceberMensagem)
        socket.on("chat:joined", aoEntrarAlguem)
        socket.on("chat:left", aoSairAlguem)
        socket.on("chat:typing", aoReceberDigitando)
        socket.on("chat:image", aoReceberImagem)
        socket.on("chat:image:processing", aoReceberImagemProcessando)
        socket.on("presence:list", aoReceberOnline)

        socketRef.current = socket

        return () => {
            socket.off("connect", aoConectar)
            socket.off("disconnect", aoDesconectar)
            socket.off("chat:message", aoReceberMensagem)
            socket.off("chat:joined", aoEntrarAlguem)
            socket.off("chat:left", aoSairAlguem)
            socket.off("chat:typing", aoReceberDigitando)
            socket.off("chat:image", aoReceberImagem)
            socket.off("chat:image:processing", aoReceberImagemProcessando)
            socket.off("presence:list", aoReceberOnline)
            socket.disconnect()
        }
    }, [isJoined, name, room])

    // Efeito 2: rola o feed para o fim quando chega item novo na sala atual
    useEffect(() => {
        const list = listRef.current
        if (!list) return
        list.scrollTo({ top: list.scrollHeight, behavior: "smooth" })
    }, [feedByRoom, room])

    // Efeito 3: limpa timers de digitação ao desmontar
    useEffect(() => {
        return () => {
            const timers = typingTimersRef.current
            Object.values(timers).forEach(clearTimeout)
        }
    }, [])

    function aoEntrar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmed = nameDraft.trim()

        if (!trimmed) {
            return
        }

        setName(trimmed)
        setIsJoined(true)
    }

    function aoEnviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmed = text.trim()

        if (!trimmed || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, room, text: trimmed })
        setText("")
    }

    function aoDigitar(event: ChangeEvent<HTMLInputElement>) {
        setText(event.target.value)

        const agora = Date.now()

        if (agora - lastTypingSentRef.current < TYPING_THROTTLE_MS) {
            return
        }

        lastTypingSentRef.current = agora
        socketRef.current?.emit("chat:typing", { name, room })
    }

    function aoClicarEmoji(event: MouseEvent<HTMLButtonElement>) {
        const emoji = event.currentTarget.dataset.emoji

        if (!emoji || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, room, text: emoji })
    }

    function aoTrocarSala(proxRoom: Room) {
        if (proxRoom === room) {
            return
        }

        socketRef.current?.emit("chat:leave", { name, room })
        setRoom(proxRoom)
        setTypingNames({})
        // O efeito 1 depende de `room`, então vai reconectar o join na nova sala
        socketRef.current?.emit("chat:join", { name, room: proxRoom })
    }

    function aoSairDaSala() {
        socketRef.current?.emit("chat:leave", { name, room })
        setIsJoined(false)
        setName("")
        setRoom("geral")
        setFeedByRoom({ geral: [], dev: [] })
        setOnline([])
        setTypingNames({})
    }

    function aoClicarAnexo() {
        setImageError(null)
        fileInputRef.current?.click()
    }

    function aoSelecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]

        if (!file) {
            return
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setImageError(`Imagem muito grande (${(file.size / 1024).toFixed(0)} KB). Limite: 500 KB.`)
            event.target.value = ""
            return
        }

        const reader = new FileReader()

        reader.onload = () => {
            const data = reader.result as string
            socketRef.current?.emit("chat:image", { name, room, filename: file.name, data })
        }

        reader.readAsDataURL(file)
        event.target.value = ""
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
    const currentFeed = feedByRoom[room]
    const typingList = Object.keys(typingNames)
    const typingLabel = typingList.length === 0
        ? null
        : typingList.length === 1
            ? `${typingList[0]} está digitando…`
            : `${typingList.join(" e ")} estão digitando…`

    return (
        <>
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
                    {/* Seletor de salas */}
                    <div className="d-flex gap-1">
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

                    <div className="d-flex align-items-center gap-2">
                        <span className="fw-semibold">{name}</span>
                        <span className={`badge ${statusClass}`}>{statusLabel}</span>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={aoSairDaSala}
                        >
                            Sair da sala
                        </button>
                    </div>
                </div>

                <div ref={listRef} className="card-body" style={{ height: "55vh", overflowY: "auto" }}>
                    {currentFeed.length === 0 && (
                        <p className="text-muted">Nenhuma mensagem ainda. Escreva a primeira.</p>
                    )}

                    {currentFeed.map((item, idx) => {
                        if (item.kind === "join") {
                            const who = item.join.name === name ? "Você" : item.join.name
                            return (
                                <p key={`join-${item.join.sentAt}-${item.join.name}-${idx}`} className="text-center my-2">
                                    <span className="badge rounded-pill bg-success-subtle text-success-emphasis fw-normal px-3 py-2">
                                        ➜ {who} entrou em #{item.join.room} · {formatTime(item.join.sentAt)}
                                    </span>
                                </p>
                            )
                        }

                        if (item.kind === "leave") {
                            const who = item.leave.name === name ? "Você" : item.leave.name
                            return (
                                <p key={`leave-${item.leave.sentAt}-${item.leave.name}-${idx}`} className="text-center my-2">
                                    <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-normal px-3 py-2">
                                        ← {who} saiu de #{item.leave.room} · {formatTime(item.leave.sentAt)}
                                    </span>
                                </p>
                            )
                        }

                        if (item.kind === "image:processing") {
                            return (
                                <p key={`img-proc-${item.processing.name}-${item.processing.filename}-${idx}`} className="text-center my-2">
                                    <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis fw-normal px-3 py-2">
                                        🖼 {item.processing.name} enviou uma imagem · processando…
                                    </span>
                                </p>
                            )
                        }

                        if (item.kind === "image") {
                            const isMine = item.image.name === name
                            const align = isMine ? "align-items-end" : "align-items-start"
                            return (
                                <div key={`img-${item.image.name}-${item.image.filename}-${idx}`} className={`d-flex flex-column ${align} mb-2`}>
                                    <small className="text-muted">{isMine ? "você" : item.image.name} · {item.image.filename}</small>
                                    <img
                                        src={item.image.thumb}
                                        alt={item.image.filename}
                                        className="rounded-3"
                                        style={{ maxWidth: "240px", maxHeight: "240px", objectFit: "contain" }}
                                    />
                                </div>
                            )
                        }

                        // kind === "message"
                        const message = item.message
                        const isMine = message.name === name
                        const align = isMine ? "align-items-end" : "align-items-start"
                        const bubble = isMine ? "bg-primary text-white" : "bg-light"
                        const isEmoji = EMOJIS.some(e => e.emoji === message.text)
                        const size = isEmoji ? "fs-1" : ""

                        return (
                            <div key={`msg-${message.sentAt}-${message.name}-${idx}`} className={`d-flex flex-column ${align} mb-2`}>
                                <small className="text-muted">{isMine ? "você" : message.name} · {formatTime(message.sentAt)}</small>
                                <span className={`rounded-3 px-3 py-2 ${bubble} ${size}`} style={{ maxWidth: "75%" }}>{message.text}</span>
                            </div>
                        )
                    })}
                </div>

                {/* Aviso de digitação */}
                {typingLabel !== null && (
                    <div className="px-3 py-1 text-muted small fst-italic border-top">
                        {typingLabel}
                    </div>
                )}

                {imageError !== null && (
                    <div className="px-3 py-1 small text-danger border-top">
                        {imageError}
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

                    {/* Input de arquivo oculto */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="d-none"
                        onChange={aoSelecionarArquivo}
                    />
                    <button
                        type="button"
                        className="btn btn-outline-secondary ms-auto"
                        title="Enviar imagem (máx. 500 KB)"
                        disabled={!isConnected}
                        onClick={aoClicarAnexo}
                    >
                        📎
                    </button>
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
                    {online.length === 0 && (
                        <li className="list-group-item text-muted">Ninguém por aqui ainda.</li>
                    )}

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
