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

// As duas salas do chat (a mesma lista do servidor: utils/chatRooms.js)
const ROOMS: ChatRoom[] = ["geral", "dev"]
const DEFAULT_ROOM: ChatRoom = "geral"

// "digitando…": avisa no máximo 1 vez a cada 1,5 s e o aviso some sozinho depois de 3 s sem novo chat:typing
const TYPING_THROTTLE_MS = 1500
const TYPING_VISIBLE_MS = 3000

// Imagem: até 500 KB e só os formatos que o worker sabe processar
const MAX_IMAGE_BYTES = 500 * 1024
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"]

function formatTime(sentAt: number): string {
    return new Date(sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

// De qual sala é cada item da lista: o feed guarda tudo e a tela mostra só a sala atual
function roomOf(item: ChatFeedItem): ChatRoom {
    if (item.kind === "message") return item.message.room
    if (item.kind === "join") return item.join.room
    if (item.kind === "leave") return item.leave.room
    return item.image.room
}

// "ana está digitando…" / "ana e beto estão digitando…" / "ana, beto e cris estão digitando…"
function typingLabel(names: string[]): string {
    if (names.length === 0) return ""
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
    const [room, setRoom] = useState<ChatRoom>(DEFAULT_ROOM)
    const [feed, setFeed] = useState<ChatFeedItem[]>([])
    const [text, setText] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [online, setOnline] = useState<OnlineUser[]>([])
    const [typers, setTypers] = useState<string[]>([])
    const [isSendingImage, setIsSendingImage] = useState(false)
    const [imageError, setImageError] = useState("")

    // Referências: o socket vive no heap (não renderiza) e o fim da lista é um elemento do HTML
    const socketRef = useRef<Socket | null>(null)
    const listRef = useRef<HTMLDivElement>(null)
    // A sala atual para os callbacks do socket (que não podem depender de `room` sem reconectar)
    const roomRef = useRef<ChatRoom>(DEFAULT_ROOM)
    // Horário do último chat:typing enviado (o throttle) e um timer de "some sozinho" por pessoa
    const lastTypingSentRef = useRef(0)
    const typingTimersRef = useRef<Map<string, number>>(new Map())

    // Efeito 1: depois de entrar na sala, abre o túnel; a limpeza fecha a conexão
    useEffect(() => {
        if (!isJoined) {
            return
        }

        // Só WebSocket (sem polling): o nginx reparte as conexões entre as réplicas sem precisar de sticky
        const socket = io({ transports: ["websocket"] })
        const timers = typingTimersRef.current

        const removeTyper = (typer: string) => {
            window.clearTimeout(timers.get(typer))
            timers.delete(typer)
            setTypers(current => current.filter(item => item !== typer))
        }

        // Ao conectar (e ao reconectar) o client diz o nome e a sala: o servidor guarda no socket e publica a presença
        const aoConectar = () => {
            setIsConnected(true)
            socket.emit("chat:join", { name, room: roomRef.current })
        }
        const aoDesconectar = () => setIsConnected(false)
        const aoReceber = (message: ChatMessage) => {
            setFeed(current => [...current, { kind: "message", message }])
            // a mensagem chegou: quem estava "digitando…" já terminou
            removeTyper(message.name)
        }
        const aoEntrarAlguem = (join: ChatJoin) => setFeed(current => [...current, { kind: "join", join }])
        const aoSairAlguem = (leave: ChatLeave) => setFeed(current => [...current, { kind: "leave", leave }])
        const aoReceberImagem = (image: ChatImage) => setFeed(current => [...current, { kind: "image", image }])
        const aoReceberOnline = (users: OnlineUser[]) => setOnline(users)
        const aoReceberDigitando = (typing: ChatTyping) => {
            // nunca de você mesmo, e só da sala em que você está
            if (typing.name === name || typing.room !== roomRef.current) {
                return
            }

            // novo chat:typing: reinicia a contagem dos 3 s desta pessoa
            window.clearTimeout(timers.get(typing.name))
            timers.set(typing.name, window.setTimeout(() => removeTyper(typing.name), TYPING_VISIBLE_MS))
            setTypers(current => (current.includes(typing.name) ? current : [...current, typing.name]))
        }

        socket.on("connect", aoConectar)
        socket.on("disconnect", aoDesconectar)
        socket.on("chat:message", aoReceber)
        socket.on("chat:joined", aoEntrarAlguem)
        socket.on("chat:left", aoSairAlguem)
        socket.on("chat:image", aoReceberImagem)
        socket.on("chat:typing", aoReceberDigitando)
        socket.on("presence:list", aoReceberOnline)

        socketRef.current = socket

        return () => {
            socket.off("connect", aoConectar)
            socket.off("disconnect", aoDesconectar)
            socket.off("chat:message", aoReceber)
            socket.off("chat:joined", aoEntrarAlguem)
            socket.off("chat:left", aoSairAlguem)
            socket.off("chat:image", aoReceberImagem)
            socket.off("chat:typing", aoReceberDigitando)
            socket.off("presence:list", aoReceberOnline)
            socket.disconnect()

            // os timers do "digitando…" não podem sobreviver ao túnel
            timers.forEach(timerId => window.clearTimeout(timerId))
            timers.clear()
        }
    }, [isJoined, name])

    // Efeito 2: depois de a tela atualizar com a mensagem nova, rola só a caixa do chat até o fim
    // (scrollIntoView rolaria a janela inteira, por isso rolamos o próprio container)
    useEffect(() => {
        const list = listRef.current
        if (!list) return
        list.scrollTo({ top: list.scrollHeight, behavior: "smooth" })
    }, [feed, room])

    // Apaga o aviso "digitando…" de todo mundo (ao trocar de sala ou sair)
    function clearTypers() {
        typingTimersRef.current.forEach(timerId => window.clearTimeout(timerId))
        typingTimersRef.current.clear()
        setTypers([])
    }

    // Entrar: guarda o nome e liga o efeito do túnel (sempre na sala padrão)
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

    // Sair da sala: avisa o servidor (chat:leave) e volta para a tela do nome; fechar o túnel é a limpeza do efeito
    function aoSair() {
        socketRef.current?.emit("chat:leave", { name, room: roomRef.current })

        clearTypers()
        roomRef.current = DEFAULT_ROOM
        setRoom(DEFAULT_ROOM)
        setFeed([])
        setOnline([])
        setText("")
        setImageError("")
        setIsConnected(false)
        setIsJoined(false)
    }

    // Trocar de sala: sai da antiga (chat:leave) e entra na nova (chat:join), sem reconectar o túnel
    function aoTrocarDeSala(event: MouseEvent<HTMLButtonElement>) {
        const next = ROOMS.find(item => item === event.currentTarget.dataset.room)

        if (!next || next === roomRef.current || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:leave", { name, room: roomRef.current })
        socketRef.current?.emit("chat:join", { name, room: next })

        roomRef.current = next
        clearTypers()
        setRoom(next)
    }

    // Digitar: atualiza o campo e avisa a sala (chat:typing), no máximo 1 vez a cada ~1,5 s (não a cada tecla)
    function aoDigitar(event: ChangeEvent<HTMLInputElement>) {
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
        socketRef.current?.emit("chat:typing", { name, room: roomRef.current })
    }

    // Enviar: emite pelo túnel e limpa o campo; a mensagem só aparece quando VOLTA do exchange
    function aoEnviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmed = text.trim()

        if (!trimmed || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, room: roomRef.current, text: trimmed })
        setText("")
    }

    // Clique no emoji: o handler lê qual foi (data-emoji) e emite pelo túnel, igual ao envio do texto
    function aoClicarEmoji(event: MouseEvent<HTMLButtonElement>) {
        const emoji = event.currentTarget.dataset.emoji

        if (!emoji || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, room: roomRef.current, text: emoji })
    }

    // Imagem: confere o tamanho (500 KB) e o formato, lê o arquivo (FileReader → dataURL base64) e emite chat:image.
    // A miniatura só aparece quando o worker terminar e o resultado VOLTAR pelo exchange results.
    function aoEscolherImagem(event: ChangeEvent<HTMLInputElement>) {
        const input = event.currentTarget
        const file = input.files?.[0]

        // limpa o input: escolher o mesmo arquivo de novo também dispara o onChange
        input.value = ""
        setImageError("")

        if (!file || !isConnected) {
            return
        }

        if (!IMAGE_TYPES.includes(file.type)) {
            setImageError("Formato não suportado: use PNG, JPG, GIF ou WEBP.")
            return
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setImageError("A imagem passa de 500 KB. Escolha uma menor.")
            return
        }

        const reader = new FileReader()

        reader.onload = () => {
            setIsSendingImage(false)

            if (typeof reader.result !== "string") {
                setImageError("Não foi possível ler o arquivo.")
                return
            }

            socketRef.current?.emit("chat:image", {
                name,
                room: roomRef.current,
                filename: file.name,
                data: reader.result,
            })
        }
        reader.onerror = () => {
            setIsSendingImage(false)
            setImageError("Não foi possível ler o arquivo.")
        }

        setIsSendingImage(true)
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

    return (
        <>
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <strong>Sala {room} · {name}</strong>

                <div className="d-flex align-items-center gap-2">
                    {ROOMS.map(item => (
                        <button
                            key={item}
                            type="button"
                            className={`btn btn-sm ${item === room ? "btn-primary" : "btn-outline-primary"}`}
                            data-room={item}
                            disabled={!isConnected}
                            onClick={aoTrocarDeSala}
                        >
                            # {item}
                        </button>
                    ))}

                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={aoSair}>Sair da sala</button>
                    <span className={`badge ${statusClass}`}>{statusLabel}</span>
                </div>
            </div>

            <div ref={listRef} className="card-body" style={{ height: "55vh", overflowY: "auto" }}>
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
                        const who = item.leave.name === name ? "Você" : item.leave.name

                        return (
                            <p key={`leave-${item.leave.room}-${item.leave.sentAt}-${item.leave.name}`} className="text-center my-2">
                                {/* "saiu da sala": outra cor (amarelo) para não se confundir com o "entrou" (verde) */}
                                <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-normal px-3 py-2">
                                    ⇦ {who} saiu da sala · {formatTime(item.leave.sentAt)}
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
                                <img src={image.thumb} alt={image.filename} className="img-thumbnail" style={{ maxWidth: 240 }} />
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

                <label className={`btn btn-outline-secondary ms-auto mb-0 ${isConnected && !isSendingImage ? "" : "disabled"}`}>
                    {isSendingImage ? "Enviando…" : "📎 imagem"}
                    <input
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={!isConnected || isSendingImage}
                        onChange={aoEscolherImagem}
                    />
                </label>
            </div>

            {imageError && <div className="card-footer border-top-0 py-1 small text-danger">{imageError}</div>}

            {/* O aviso fica sempre ocupando a linha (altura fixa): a tela não "pula" quando alguém começa a digitar */}
            <div className="card-footer border-top-0 py-1 small text-muted" style={{ minHeight: "2rem" }}>
                {typingLabel(typers)}
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
        </>
    )
}
