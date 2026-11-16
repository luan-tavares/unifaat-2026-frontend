import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent, MouseEvent } from "react"
import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"
import type {
    ChatFeedItem,
    ChatImage,
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

// As salas do chat: cada uma mostra só as suas mensagens
const ROOMS: ChatRoom[] = ["geral", "dev"]

// "digitando…": no máximo 1 envio a cada 1,5 s; o aviso some depois de 3 s sem novo chat:typing
const TYPING_THROTTLE_MS = 1500
const TYPING_TIMEOUT_MS = 3000

// Limite da imagem: maior que isso nem sai do navegador
const MAX_IMAGE_BYTES = 500 * 1024

function formatTime(sentAt: number): string {
    return new Date(sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

// A sala de cada item do feed (mensagem, aviso ou imagem)
function roomOf(item: ChatFeedItem): ChatRoom {
    if (item.kind === "message") return item.message.room
    if (item.kind === "join") return item.join.room
    if (item.kind === "leave") return item.leave.room
    return item.image.room
}

// "ana está digitando…" / "ana e beto estão digitando…" / "ana, beto e caio estão digitando…"
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
    const [feed, setFeed] = useState<ChatFeedItem[]>([])
    const [text, setText] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [online, setOnline] = useState<OnlineUser[]>([])
    const [room, setRoom] = useState<ChatRoom>("geral")
    const [typingNames, setTypingNames] = useState<string[]>([])
    const [imageError, setImageError] = useState("")

    // Referências: o socket vive no heap (não renderiza) e o fim da lista é um elemento do HTML
    const socketRef = useRef<Socket | null>(null)
    const endRef = useRef<HTMLDivElement>(null)
    // A sala atual para quem roda fora da renderização (o connect/reconnect); não entra nas dependências do efeito
    const roomRef = useRef<ChatRoom>("geral")
    // Horário do último chat:typing enviado (limita a 1 envio a cada 1,5 s)
    const lastTypingRef = useRef(0)
    // Um timer por pessoa digitando: some sozinho depois de 3 s
    const typingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    // Efeito 1: depois de entrar na sala, abre o túnel; a limpeza fecha a conexão
    useEffect(() => {
        if (!isJoined) {
            return
        }

        // Só WebSocket (sem polling): o nginx reparte as conexões entre as réplicas sem precisar de sticky
        const socket = io({ transports: ["websocket"] })
        const typingTimers = typingTimersRef.current

        // Tira a pessoa do aviso "digitando…" (e cancela o timer dela)
        const pararDigitando = (who: string) => {
            const timer = typingTimers.get(who)

            if (timer !== undefined) {
                clearTimeout(timer)
            }

            typingTimers.delete(who)
            setTypingNames(current => current.filter(typingName => typingName !== who))
        }

        // Ao conectar (e ao reconectar) o client diz o nome e a sala: o servidor coloca o socket na sala e publica a presença
        const aoConectar = () => {
            setIsConnected(true)
            socket.emit("chat:join", { name, room: roomRef.current })
        }
        const aoDesconectar = () => setIsConnected(false)
        const aoReceber = (message: ChatMessage) => {
            setFeed(current => [...current, { kind: "message", message }])
            pararDigitando(message.name)
        }
        const aoEntrarAlguem = (join: ChatJoin) => setFeed(current => [...current, { kind: "join", join }])
        const aoSairAlguem = (leave: ChatLeave) => {
            setFeed(current => [...current, { kind: "leave", leave }])
            pararDigitando(leave.name)
        }
        const aoReceberImagem = (image: ChatImage) => setFeed(current => [...current, { kind: "image", image }])
        const aoReceberOnline = (users: OnlineUser[]) => setOnline(users)

        // Outra pessoa digitando: mostra o aviso e (re)arma o timer de 3 s; o próprio nome é ignorado
        const aoDigitarAlguem = (typing: ChatTyping) => {
            if (typing.name === name) {
                return
            }

            const timer = typingTimers.get(typing.name)

            if (timer !== undefined) {
                clearTimeout(timer)
            }

            typingTimers.set(typing.name, setTimeout(() => pararDigitando(typing.name), TYPING_TIMEOUT_MS))
            setTypingNames(current => current.includes(typing.name) ? current : [...current, typing.name])
        }

        socket.on("connect", aoConectar)
        socket.on("disconnect", aoDesconectar)
        socket.on("chat:message", aoReceber)
        socket.on("chat:joined", aoEntrarAlguem)
        socket.on("chat:left", aoSairAlguem)
        socket.on("chat:typing", aoDigitarAlguem)
        socket.on("chat:image", aoReceberImagem)
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
            socket.off("presence:list", aoReceberOnline)
            socket.disconnect()

            // Limpeza dos timers do "digitando…"
            typingTimers.forEach(timer => clearTimeout(timer))
            typingTimers.clear()
            setTypingNames([])
        }
    }, [isJoined, name])

    // Efeito 2: depois de a tela atualizar com a mensagem nova, rola até o fim
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
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

    // Digitando: atualiza o campo e emite chat:typing no máximo 1 vez a cada ~1,5 s
    function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
        setText(event.target.value)

        const now = Date.now()

        if (!isConnected || now - lastTypingRef.current < TYPING_THROTTLE_MS) {
            return
        }

        lastTypingRef.current = now
        socketRef.current?.emit("chat:typing", { name, room })
    }

    // Esvazia o aviso "digitando…" (ao trocar de sala, os avisos da sala antiga não valem mais)
    function clearTyping() {
        typingTimersRef.current.forEach(timer => clearTimeout(timer))
        typingTimersRef.current.clear()
        setTypingNames([])
    }

    // Trocar de sala: sai da antiga (chat:leave) e entra na nova (chat:join)
    function handleChangeRoom(event: MouseEvent<HTMLButtonElement>) {
        const nextRoom = ROOMS.find(item => item === event.currentTarget.dataset.room)

        if (!nextRoom || nextRoom === room) {
            return
        }

        socketRef.current?.emit("chat:leave", { name, room })
        socketRef.current?.emit("chat:join", { name, room: nextRoom })

        roomRef.current = nextRoom
        setRoom(nextRoom)
        clearTyping()
    }

    // Sair da sala: avisa os outros (chat:leave) e volta para a tela do nome (o efeito fecha o túnel)
    function handleLeave() {
        socketRef.current?.emit("chat:leave", { name, room })
        setIsJoined(false)
    }

    // Imagem: até 500 KB, lida como dataURL e enviada pelo túnel; quem gera a miniatura é o worker
    function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
        const input = event.currentTarget
        const file = input.files?.[0]

        // Limpa o campo para poder escolher o mesmo arquivo de novo
        input.value = ""
        setImageError("")

        if (!file || !isConnected) {
            return
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setImageError(`A imagem "${file.name}" passa de 500 KB: escolha uma menor.`)
            return
        }

        const reader = new FileReader()
        const currentRoom = room

        reader.addEventListener("load", () => {
            if (typeof reader.result !== "string") {
                return
            }

            const upload: ChatImageUpload = { name, room: currentRoom, filename: file.name, data: reader.result }

            socketRef.current?.emit("chat:image", upload)
        })

        reader.readAsDataURL(file)
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

    const statusClass = isConnected ? "text-bg-success" : "text-bg-secondary"
    const statusLabel = isConnected ? "conectado" : "conectando..."
    const visibleFeed = feed.filter(item => roomOf(item) === room)

    return (
        <>
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <div className="btn-group" role="group" aria-label="Salas">
                    {ROOMS.map(item => (
                        <button
                            key={item}
                            type="button"
                            className={`btn btn-sm ${item === room ? "btn-primary" : "btn-outline-primary"}`}
                            data-room={item}
                            disabled={!isConnected}
                            onClick={handleChangeRoom}
                        >
                            # {item}
                        </button>
                    ))}
                </div>
                <strong>Sala #{room} · {name}</strong>
                <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleLeave}>Sair da sala</button>
                </div>
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
                                {/* Mensagem de sistema de saída: outra cor (amarelo), diferente do "entrou" */}
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
                            <div key={`image-${image.room}-${image.sentAt}-${image.name}-${image.filename}`} className={`d-flex flex-column ${align} mb-2`}>
                                <small className="text-muted">{isMine ? "você enviou" : `${image.name} enviou`} uma imagem · {formatTime(image.sentAt)}</small>
                                <img src={image.thumb} alt={image.filename} className="rounded-3 border" style={{ maxWidth: "240px" }} />
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

            <div className="card-footer d-flex gap-2 pb-0 border-top-0 align-items-center">
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

                <label className={`btn btn-outline-secondary mb-0 ${isConnected ? "" : "disabled"}`} htmlFor="chat-image">📎 imagem</label>
                <input id="chat-image" type="file" accept="image/*" className="d-none" disabled={!isConnected} onChange={handleImageChange} />
            </div>

            {imageError !== "" && <div className="card-footer border-top-0 pb-0 text-danger small">{imageError}</div>}

            {typingNames.length > 0 && (
                <div className="card-footer border-top-0 pb-0 text-muted small fst-italic">{typingLabel(typingNames)}</div>
            )}

            <form className="card-footer d-flex gap-2" onSubmit={aoEnviar}>
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
