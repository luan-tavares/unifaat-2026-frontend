import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent, MouseEvent } from "react"
import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"
import type {
    ChatFeedItem,
    ChatImage,
    ChatImageError,
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

// As salas: cada uma mostra só as suas mensagens
const ROOMS: { id: ChatRoom; label: string }[] = [
    { id: "geral", label: "# geral" },
    { id: "dev", label: "# dev" },
]

// "Digitando…": no máximo 1 aviso a cada 1,5 s; o aviso some sozinho 3 s depois do último
const TYPING_THROTTLE_MS = 1500
const TYPING_EXPIRES_MS = 3000

// Imagem: acima disso nem é lida, o erro aparece e nada é enviado
const MAX_IMAGE_BYTES = 500 * 1024

function formatTime(sentAt: number): string {
    return new Date(sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function roomOf(item: ChatFeedItem): ChatRoom {
    if (item.kind === "message") return item.message.room
    if (item.kind === "join") return item.join.room
    if (item.kind === "leave") return item.leave.room
    return item.image.room
}

function typingKey(typing: ChatTyping): string {
    return `${typing.room}:${typing.name}`
}

// "ana está digitando…", "ana e beto estão digitando…", "ana, beto e caio estão digitando…"
function typingLabel(names: string[]): string {
    if (names.length === 1) return `${names[0]} está digitando…`

    const last = names[names.length - 1]
    return `${names.slice(0, -1).join(", ")} e ${last} estão digitando…`
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
    const [isSending, setIsSending] = useState(false)
    const [imageError, setImageError] = useState("")

    // Referências: o socket vive no heap (não renderiza) e o fim da lista é um elemento do HTML
    const socketRef = useRef<Socket | null>(null)
    const endRef = useRef<HTMLDivElement>(null)
    // A sala atual para o chat:join da (re)conexão, sem recriar o túnel a cada troca de sala
    const roomRef = useRef<ChatRoom>("geral")
    // Horário do último chat:typing enviado (o "freio" do aviso)
    const lastTypingRef = useRef(0)
    // Um timer por pessoa digitando: some sozinho depois de 3 s sem aviso novo
    const typingTimersRef = useRef<Map<string, number>>(new Map())

    // Efeito 1: depois de entrar na sala, abre o túnel; a limpeza fecha a conexão e os timers
    useEffect(() => {
        if (!isJoined) {
            return
        }

        // Só WebSocket (sem polling): o nginx reparte as conexões entre as réplicas sem precisar de sticky
        const socket = io({ transports: ["websocket"] })
        const timers = typingTimersRef.current

        const pararDeDigitar = (typing: ChatTyping) => {
            const key = typingKey(typing)
            window.clearTimeout(timers.get(key))
            timers.delete(key)
            setTypers(current => current.filter(item => typingKey(item) !== key))
        }

        // Ao conectar (e ao reconectar) o client diz o nome e a sala: o servidor coloca o socket na sala
        const aoConectar = () => {
            setIsConnected(true)
            socket.emit("chat:join", { name, room: roomRef.current })
        }
        const aoDesconectar = () => setIsConnected(false)
        const aoReceber = (message: ChatMessage) => {
            setFeed(current => [...current, { kind: "message", message }])
            pararDeDigitar(message)
        }
        const aoEntrarAlguem = (join: ChatJoin) => setFeed(current => [...current, { kind: "join", join }])
        const aoSairAlguem = (leave: ChatLeave) => {
            setFeed(current => [...current, { kind: "leave", leave }])
            pararDeDigitar(leave)
        }
        const aoReceberImagem = (image: ChatImage) => {
            setFeed(current => [...current, { kind: "image", image }])

            if (image.name === name) {
                setIsSending(false)
            }
        }
        const aoRecusarImagem = (error: ChatImageError) => {
            setImageError(error.message)
            setIsSending(false)
        }
        const aoReceberOnline = (users: OnlineUser[]) => setOnline(users)

        // Outra pessoa digitando: mostra o aviso e (re)começa a contagem de 3 s
        const aoDigitarAlguem = (typing: ChatTyping) => {
            if (typing.name === name) {
                return
            }

            const key = typingKey(typing)
            window.clearTimeout(timers.get(key))
            timers.set(key, window.setTimeout(() => pararDeDigitar(typing), TYPING_EXPIRES_MS))

            setTypers(current => {
                if (current.some(item => typingKey(item) === key)) {
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
        socket.on("chat:typing", aoDigitarAlguem)
        socket.on("chat:image", aoReceberImagem)
        socket.on("chat:image-error", aoRecusarImagem)
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
            socket.off("chat:image-error", aoRecusarImagem)
            socket.off("presence:list", aoReceberOnline)
            socket.disconnect()

            for (const timer of timers.values()) {
                window.clearTimeout(timer)
            }
            timers.clear()
        }
    }, [isJoined, name])

    // Efeito 2: depois de a tela atualizar com a mensagem nova (ou trocar de sala), rola até o fim
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [feed, room])

    function aoDigitarNome(event: ChangeEvent<HTMLInputElement>) {
        setNameDraft(event.target.value)
    }

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

    // Digitar: atualiza o campo e avisa "digitando…", mas no máximo 1 vez a cada 1,5 s
    function aoDigitarTexto(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value
        setText(value)

        if (!value.trim() || !isConnected) {
            return
        }

        const now = Date.now()

        if (now - lastTypingRef.current < TYPING_THROTTLE_MS) {
            return
        }

        lastTypingRef.current = now
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
        setText("")
        lastTypingRef.current = 0
    }

    // Clique no emoji: o handler lê qual foi (data-emoji) e emite pelo túnel, igual ao envio do texto
    function aoClicarEmoji(event: MouseEvent<HTMLButtonElement>) {
        const emoji = event.currentTarget.dataset.emoji

        if (!emoji || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, room, text: emoji })
    }

    // Trocar de sala: sai da antiga e entra na nova (o túnel continua o mesmo)
    function aoTrocarSala(event: MouseEvent<HTMLButtonElement>) {
        const target = ROOMS.find(item => item.id === event.currentTarget.dataset.room)

        if (!target || target.id === room) {
            return
        }

        socketRef.current?.emit("chat:leave", { name, room })
        socketRef.current?.emit("chat:join", { name, room: target.id })
        roomRef.current = target.id
        setRoom(target.id)
    }

    // Sair da sala: avisa os outros e volta para a tela do nome (a limpeza do efeito fecha o túnel)
    function aoSairDaSala() {
        socketRef.current?.emit("chat:leave", { name, room })
        setIsJoined(false)
        setFeed([])
        setTypers([])
        setIsSending(false)
        setImageError("")
    }

    // Imagem: valida o tamanho, lê como dataURL e emite; quem gera a miniatura é o worker
    function aoEscolherImagem(event: ChangeEvent<HTMLInputElement>) {
        const input = event.currentTarget
        const file = input.files?.[0]

        // Limpa o campo: escolher o mesmo arquivo de novo dispara o onChange outra vez
        input.value = ""
        setImageError("")

        if (!file || !isConnected) {
            return
        }

        if (!file.type.startsWith("image/")) {
            setImageError(`"${file.name}" não é uma imagem.`)
            return
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setImageError(`"${file.name}" tem ${Math.ceil(file.size / 1024)} KB: o limite é 500 KB.`)
            return
        }

        const reader = new FileReader()
        const imageRoom = room

        reader.onload = () => {
            if (typeof reader.result !== "string") {
                return
            }

            socketRef.current?.emit("chat:image", { name, room: imageRoom, filename: file.name, data: reader.result })
            setIsSending(true)
        }
        reader.onerror = () => setImageError("Não foi possível ler a imagem.")
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
                        onChange={aoDigitarNome}
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
    const roomFeed = feed.filter(item => roomOf(item) === room)
    const typingNames = typers.filter(item => item.room === room).map(item => item.name)

    return (
        <>
        <div className="card">
            <div className="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <div className="btn-group" role="group" aria-label="Salas">
                    {ROOMS.map(item => {
                        const roomClass = item.id === room ? "btn-primary" : "btn-outline-primary"

                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={`btn btn-sm ${roomClass}`}
                                data-room={item.id}
                                disabled={!isConnected}
                                onClick={aoTrocarSala}
                            >
                                {item.label}
                            </button>
                        )
                    })}
                </div>

                <div className="d-flex gap-2 align-items-center">
                    <strong>{name}</strong>
                    <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={aoSairDaSala}>Sair da sala</button>
                </div>
            </div>

            <div className="card-body" style={{ height: "55vh", overflowY: "auto" }}>
                {roomFeed.length === 0 && <p className="text-muted">Nenhuma mensagem ainda. Escreva a primeira.</p>}

                {roomFeed.map(item => {
                    if (item.kind === "join") {
                        const who = item.join.name === name ? "Você" : item.join.name

                        return (
                            <p key={`join-${item.join.sentAt}-${item.join.name}`} className="text-center my-2">
                                {/* Mensagem de sistema: cor própria (verde), diferente das bolhas dos participantes */}
                                <span className="badge rounded-pill bg-success-subtle text-success-emphasis fw-normal px-3 py-2">
                                    ➜ {who} entrou na sala · {formatTime(item.join.sentAt)}
                                </span>
                            </p>
                        )
                    }

                    if (item.kind === "leave") {
                        return (
                            <p key={`leave-${item.leave.sentAt}-${item.leave.name}`} className="text-center my-2">
                                {/* "Saiu": outra cor (amarelo), para não confundir com o "entrou" */}
                                <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-normal px-3 py-2">
                                    ← {item.leave.name} saiu da sala · {formatTime(item.leave.sentAt)}
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
                                    {isMine ? "você enviou" : `${image.name} enviou`} uma imagem · {formatTime(image.sentAt)}
                                </small>
                                <img src={image.thumb} alt={image.filename} title={image.filename} className="rounded-3 border" style={{ maxWidth: "240px" }} />
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

            <div className="card-footer d-flex flex-wrap gap-2 pb-0 border-top-0">
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

                <label className={`btn btn-outline-secondary mb-0 d-flex align-items-center ${isConnected ? "" : "disabled"}`}>
                    📎 imagem
                    <input type="file" accept="image/*" hidden disabled={!isConnected} onChange={aoEscolherImagem} />
                </label>
            </div>

            <div className="px-3 pt-2 small" style={{ minHeight: "1.75rem" }}>
                {typingNames.length > 0 && <span className="text-muted fst-italic">{typingLabel(typingNames)}</span>}
                {isSending && <span className="text-primary ms-2">Imagem enviada, aguardando o worker…</span>}
                {imageError !== "" && <span className="text-danger ms-2">{imageError}</span>}
            </div>

            <form className="card-footer d-flex gap-2" onSubmit={aoEnviar}>
                <input
                    className="form-control"
                    value={text}
                    onChange={aoDigitarTexto}
                    placeholder={`Mensagem para # ${room}...`}
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
