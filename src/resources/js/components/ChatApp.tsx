import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent, MouseEvent } from "react"
import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"
import type { ChatFeedItem, ChatImage, ChatJoin, ChatLeft, ChatMessage, ChatRoom, ChatTyping, OnlineUser } from "../types/chat"

// As salas disponíveis, o limite do arquivo de imagem e os tempos do "digitando…"
const ROOMS: ChatRoom[] = ["geral", "dev"]
const MAX_IMAGE_BYTES = 500 * 1024
const TYPING_EMIT_INTERVAL_MS = 1500
const TYPING_EXPIRE_MS = 3000

function isRoom(value: string | undefined): value is ChatRoom {
    return ROOMS.some(room => room === value)
}

// "ana está digitando…" / "ana e beto estão digitando…" / "ana, beto e carla estão digitando…"
function formatTypers(names: string[]): string {
    if (names.length === 1) return `${names[0]} está digitando…`

    const last = names[names.length - 1]
    const others = names.slice(0, -1).join(", ")

    return `${others} e ${last} estão digitando…`
}

// Os botões de reação: clicar manda o emoji como mensagem
const EMOJIS = [
    { emoji: "🔥", label: "fogo" },
    { emoji: "💣", label: "bomba" },
    { emoji: "😉", label: "piscar" },
    { emoji: "💧", label: "água" },
    { emoji: "🎉", label: "festa" },
]

function formatTime(sentAt: number): string {
    return new Date(sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

// O chat (sem login): primeiro o nome, depois a sala. As mensagens chegam pelo túnel WebSocket
// (nginx → websocket → RabbitMQ) e o React só mostra o estado.
export function ChatApp() {
    const [nameDraft, setNameDraft] = useState("")
    const [name, setName] = useState("")
    const [isJoined, setIsJoined] = useState(false)
    const [feed, setFeed] = useState<ChatFeedItem[]>([])
    const [text, setText] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [online, setOnline] = useState<OnlineUser[]>([])
    const [room, setRoom] = useState<ChatRoom>("geral")
    const [typers, setTypers] = useState<string[]>([])
    const [imageError, setImageError] = useState<string | null>(null)
    const [pendingImages, setPendingImages] = useState(0)

    // Referências: o socket vive no heap (não renderiza) e o fim da lista é um elemento do HTML
    const socketRef = useRef<Socket | null>(null)
    const listRef = useRef<HTMLDivElement>(null)
    // Sala atual para o "connect" (o efeito do túnel não pode depender dela, senão reconectaria a cada troca)
    const roomRef = useRef<ChatRoom>("geral")
    // Horário do último chat:typing enviado (limita a ~1,5 s) e um timer de expiração por pessoa digitando
    const lastTypingSentRef = useRef(0)
    const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    // Para de mostrar "fulano está digitando…" e cancela o timer dele
    function clearTyper(who: string) {
        const timer = typingTimersRef.current.get(who)

        if (timer) clearTimeout(timer)

        typingTimersRef.current.delete(who)
        setTypers(current => current.filter(typer => typer !== who))
    }

    function clearAllTypers() {
        typingTimersRef.current.forEach(timer => clearTimeout(timer))
        typingTimersRef.current.clear()
        setTypers([])
    }

    // Efeito 1: depois de entrar na sala, abre o túnel; a limpeza fecha a conexão
    useEffect(() => {
        if (!isJoined) {
            return
        }

        // Só WebSocket (sem polling): o nginx reparte as conexões entre as réplicas sem precisar de sticky
        const socket = io({ transports: ["websocket"] })

        const timers = typingTimersRef.current

        // Ao conectar (e ao reconectar) o client diz o nome e a sala: o servidor guarda no socket e publica a presença
        const aoConectar = () => {
            setIsConnected(true)
            socket.emit("chat:join", { name, room: roomRef.current })
        }
        const aoDesconectar = () => setIsConnected(false)
        const aoReceber = (message: ChatMessage) => {
            // A mensagem chegou: a pessoa não está mais "digitando"
            clearTyper(message.name)
            setFeed(current => [...current, { kind: "message", room: message.room, message }])
        }
        const aoEntrarAlguem = (join: ChatJoin) => setFeed(current => [...current, { kind: "join", room: join.room, join }])
        const aoSairAlguem = (left: ChatLeft) => setFeed(current => [...current, { kind: "left", room: left.room, left }])
        const aoReceberOnline = (users: OnlineUser[]) => setOnline(users)
        const aoReceberImagem = (image: ChatImage) => {
            if (image.name === name) setPendingImages(current => Math.max(0, current - 1))
            clearTyper(image.name)
            setFeed(current => [...current, { kind: "image", room: image.room, image, sentAt: Date.now() }])
        }
        // Nunca mostra o próprio nome; cada aviso reinicia o timer de 3 s dessa pessoa
        const aoDigitar = (typing: ChatTyping) => {
            if (typing.name === name) return

            const previous = timers.get(typing.name)

            if (previous) clearTimeout(previous)

            setTypers(current => (current.includes(typing.name) ? current : [...current, typing.name]))
            timers.set(typing.name, setTimeout(() => clearTyper(typing.name), TYPING_EXPIRE_MS))
        }

        socket.on("connect", aoConectar)
        socket.on("disconnect", aoDesconectar)
        socket.on("chat:message", aoReceber)
        socket.on("chat:joined", aoEntrarAlguem)
        socket.on("chat:left", aoSairAlguem)
        socket.on("chat:image", aoReceberImagem)
        socket.on("chat:typing", aoDigitar)
        socket.on("presence:list", aoReceberOnline)

        socketRef.current = socket

        return () => {
            socket.off("connect", aoConectar)
            socket.off("disconnect", aoDesconectar)
            socket.off("chat:message", aoReceber)
            socket.off("chat:joined", aoEntrarAlguem)
            socket.off("chat:left", aoSairAlguem)
            socket.off("chat:image", aoReceberImagem)
            socket.off("chat:typing", aoDigitar)
            socket.off("presence:list", aoReceberOnline)
            timers.forEach(timer => clearTimeout(timer))
            timers.clear()
            socket.disconnect()
        }
        // clearTyper só usa refs e setters estáveis: não precisa entrar nas dependências
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isJoined, name])

    // Efeito 2: depois de a tela atualizar com a mensagem nova, rola só a caixa do chat até o fim
    // (scrollIntoView rolaria a janela inteira, por isso rolamos o próprio container)
    useEffect(() => {
        const list = listRef.current
        if (!list) return
        list.scrollTo({ top: list.scrollHeight, behavior: "smooth" })
    }, [feed])

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

    // Digitando: avisa a sala, mas no máximo 1 vez a cada ~1,5 s (o horário do último envio fica em useRef)
    function aoMudarTexto(event: ChangeEvent<HTMLInputElement>) {
        setText(event.target.value)

        const now = Date.now()

        if (!isConnected || now - lastTypingSentRef.current < TYPING_EMIT_INTERVAL_MS) {
            return
        }

        lastTypingSentRef.current = now
        socketRef.current?.emit("chat:typing", { name, room })
    }

    // Trocar de sala: sai da antiga, entra na nova (o feed continua guardado, a tela filtra por sala)
    function aoTrocarSala(event: MouseEvent<HTMLButtonElement>) {
        const nextRoom = event.currentTarget.dataset.room

        if (!isRoom(nextRoom) || nextRoom === room) {
            return
        }

        socketRef.current?.emit("chat:leave", { name, room })
        socketRef.current?.emit("chat:join", { name, room: nextRoom })

        roomRef.current = nextRoom
        clearAllTypers()
        setRoom(nextRoom)
    }

    // Sair da sala: avisa e volta para a tela do nome (o efeito do túnel fecha a conexão)
    function aoSair() {
        socketRef.current?.emit("chat:leave", { name, room })

        clearAllTypers()
        roomRef.current = "geral"
        setRoom("geral")
        setFeed([])
        setOnline([])
        setPendingImages(0)
        setImageError(null)
        setIsJoined(false)
    }

    // Imagem: recusa o que passa de 500 KB; senão lê como data URL (base64) e emite pelo túnel
    function aoEscolherImagem(event: ChangeEvent<HTMLInputElement>) {
        const input = event.currentTarget
        const file = input.files?.[0]

        input.value = ""

        if (!file || !isConnected) {
            return
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setImageError(`"${file.name}" tem mais de 500 KB e não foi enviada.`)
            return
        }

        setImageError(null)

        const reader = new FileReader()

        reader.onload = () => {
            if (typeof reader.result !== "string") return

            socketRef.current?.emit("chat:image", { name, room, filename: file.name, data: reader.result })
            setPendingImages(current => current + 1)
        }
        reader.onerror = () => setImageError("Não foi possível ler a imagem.")
        reader.readAsDataURL(file)
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

    const roomFeed = feed.filter(item => item.room === room)

    const statusClass = isConnected ? "text-bg-success" : "text-bg-secondary"
    const statusLabel = isConnected ? "conectado" : "conectando..."

    return (
        <>
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <strong>Sala {room} · {name}</strong>
                <span className="d-flex gap-2 align-items-center">
                    <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={aoSair}>Sair da sala</button>
                </span>
            </div>

            <div className="card-header d-flex gap-2">
                {ROOMS.map(item => (
                    <button
                        key={item}
                        type="button"
                        className={`btn btn-sm ${item === room ? "btn-primary" : "btn-outline-primary"}`}
                        data-room={item}
                        onClick={aoTrocarSala}
                    >
                        # {item}
                    </button>
                ))}
            </div>

            <div ref={listRef} className="card-body" style={{ height: "55vh", overflowY: "auto" }}>
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

                    if (item.kind === "left") {
                        const who = item.left.name === name ? "Você" : item.left.name

                        return (
                            <p key={`left-${item.left.sentAt}-${item.left.name}`} className="text-center my-2">
                                {/* Saída: outra cor (amarelo), diferente da entrada (verde) */}
                                <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-normal px-3 py-2">
                                    ⇦ {who} saiu da sala · {formatTime(item.left.sentAt)}
                                </span>
                            </p>
                        )
                    }

                    if (item.kind === "image") {
                        const isMyImage = item.image.name === name
                        const imageAlign = isMyImage ? "align-items-end" : "align-items-start"

                        return (
                            <div key={`image-${item.sentAt}-${item.image.name}-${item.image.filename}`} className={`d-flex flex-column ${imageAlign} mb-2`}>
                                <small className="text-muted">{isMyImage ? "você" : item.image.name} enviou uma imagem · {formatTime(item.sentAt)}</small>
                                <img src={item.image.thumb} alt={item.image.filename} className="rounded-3 border" style={{ maxWidth: "240px" }} />
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

            <div className="card-footer border-top-0 pt-0 pb-0" style={{ minHeight: "1.75rem" }}>
                {typers.length > 0 && <small className="text-muted fst-italic">{formatTypers(typers)}</small>}
                {pendingImages > 0 && <small className="text-muted fst-italic d-block">Processando imagem…</small>}
                {imageError && <small className="text-danger d-block">{imageError}</small>}
            </div>

            <form className="card-footer d-flex gap-2" onSubmit={aoEnviar}>
                <label className={`btn btn-outline-secondary mb-0 ${isConnected ? "" : "disabled"}`}>
                    📎 imagem
                    <input type="file" accept="image/*" hidden disabled={!isConnected} onChange={aoEscolherImagem} />
                </label>
                <input
                    className="form-control"
                    value={text}
                    onChange={aoMudarTexto}
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
