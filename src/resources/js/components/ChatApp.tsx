import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent, MouseEvent } from "react"
import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"
import { ROOMS } from "../types/chat"
import { findAttack } from "./chatAttacks"
import type { ChatFeed, ChatFeedItem, ChatImage, ChatJoin, ChatLeft, ChatMessage, ChatTyping, OnlineUser, Room } from "../types/chat"

// Os botões de reação: clicar manda o emoji como mensagem
const EMOJIS = [
    { emoji: "🔥", label: "Katon: Goukakyuu no Jutsu!" },
    { emoji: "💣", label: "Arte é uma explosão! (Deidara)" },
    { emoji: "😉", label: "Piscadinha de protagonista" },
    { emoji: "💧", label: "Suiton: Suiryuudan no Jutsu!" },
    { emoji: "🎉", label: "Genki Dama da festa" },
]

const MAX_IMAGE_BYTES = 500 * 1024
const TYPING_EMIT_INTERVAL_MS = 1500
const TYPING_VISIBLE_MS = 3000

const EMPTY_FEED: ChatFeed = { geral: [], dev: [] }

// Cada sala guarda só as suas coisas
function addItem(current: ChatFeed, room: Room, item: ChatFeedItem): ChatFeed {
    return { ...current, [room]: [...current[room], item] }
}

// "ana está digitando…" / "ana e beto estão digitando…" / "ana, beto e caio estão digitando…"
function formatTyping(names: string[]): string {
    if (names.length === 1) {
        return `${names[0]} está digitando…`
    }

    const last = names[names.length - 1]
    const first = names.slice(0, -1).join(", ")

    return `${first} e ${last} estão digitando…`
}

function formatTime(sentAt: number): string {
    return new Date(sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

// O chat (sem login): primeiro o nome, depois a sala. As mensagens chegam pelo túnel WebSocket
// (nginx → websocket → RabbitMQ) e o React só mostra o estado.
export function ChatApp() {
    const [nameDraft, setNameDraft] = useState("")
    const [name, setName] = useState("")
    const [isJoined, setIsJoined] = useState(false)
    const [feed, setFeed] = useState<ChatFeed>(EMPTY_FEED)
    const [text, setText] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [online, setOnline] = useState<OnlineUser[]>([])
    const [room, setRoom] = useState<Room>("geral")
    const [typingNames, setTypingNames] = useState<string[]>([])
    const [imageError, setImageError] = useState("")
    const [isSending, setIsSending] = useState(false)

    // Referências: o socket vive no heap (não renderiza) e o fim da lista é um elemento do HTML
    const socketRef = useRef<Socket | null>(null)
    const endRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    // A sala atual também vive numa ref: o handler de "connect" (reconexão) precisa da sala de agora, não da do render antigo
    const roomRef = useRef<Room>("geral")
    // Horário do último chat:typing emitido (não renderiza) e um timer por pessoa digitando
    const lastTypingRef = useRef(0)
    const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

    // Efeito 1: depois de entrar na sala, abre o túnel; a limpeza fecha a conexão
    useEffect(() => {
        if (!isJoined) {
            return
        }

        // Só WebSocket (sem polling): o nginx reparte as conexões entre as réplicas sem precisar de sticky
        const socket = io({ transports: ["websocket"] })

        // Ao conectar (e ao reconectar) o client diz o nome e a sala: o servidor guarda no socket e publica a presença
        const aoConectar = () => {
            setIsConnected(true)
            socket.emit("chat:join", { name, room: roomRef.current })
        }
        const aoDesconectar = () => setIsConnected(false)

        // Para de mostrar "digitando" de uma pessoa (a mensagem dela chegou ou o tempo acabou)
        const pararDigitando = (who: string) => {
            clearTimeout(typingTimersRef.current[who])
            delete typingTimersRef.current[who]
            setTypingNames(current => current.filter(item => item !== who))
        }

        const aoReceber = (message: ChatMessage) => {
            pararDigitando(message.name)
            setFeed(current => addItem(current, message.room, { kind: "message", message }))
        }
        const aoEntrarAlguem = (join: ChatJoin) => setFeed(current => addItem(current, join.room, { kind: "join", join }))
        const aoSairAlguem = (left: ChatLeft) => setFeed(current => addItem(current, left.room, { kind: "left", left }))
        const aoDigitar = (typing: ChatTyping) => {
            // Nunca mostra o "digitando" de você mesmo
            if (typing.name === name) {
                return
            }

            clearTimeout(typingTimersRef.current[typing.name])
            typingTimersRef.current[typing.name] = setTimeout(() => pararDigitando(typing.name), TYPING_VISIBLE_MS)
            setTypingNames(current => current.includes(typing.name) ? current : [...current, typing.name])
        }
        const aoReceberImagem = (image: ChatImage) => {
            if (image.name === name) {
                setIsSending(false)
            }

            setFeed(current => addItem(current, image.room, { kind: "image", image }))
        }
        const aoReceberOnline = (users: OnlineUser[]) => setOnline(users)

        socket.on("connect", aoConectar)
        socket.on("disconnect", aoDesconectar)
        socket.on("chat:message", aoReceber)
        socket.on("chat:joined", aoEntrarAlguem)
        socket.on("chat:left", aoSairAlguem)
        socket.on("chat:typing", aoDigitar)
        socket.on("chat:image", aoReceberImagem)
        socket.on("presence:list", aoReceberOnline)

        socketRef.current = socket

        return () => {
            socket.off("connect", aoConectar)
            socket.off("disconnect", aoDesconectar)
            socket.off("chat:message", aoReceber)
            socket.off("chat:joined", aoEntrarAlguem)
            socket.off("chat:left", aoSairAlguem)
            socket.off("chat:typing", aoDigitar)
            socket.off("chat:image", aoReceberImagem)
            socket.off("presence:list", aoReceberOnline)

            // Limpa os timers do "digitando" para não atualizar estado depois de sair
            Object.values(typingTimersRef.current).forEach(clearTimeout)
            typingTimersRef.current = {}
            socket.disconnect()
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

    // Digitar: atualiza o campo e avisa a sala, no máximo 1 vez a cada ~1,5 s (não a cada tecla)
    function aoMudarTexto(event: ChangeEvent<HTMLInputElement>) {
        setText(event.target.value)

        const now = Date.now()

        if (!isConnected || now - lastTypingRef.current < TYPING_EMIT_INTERVAL_MS) {
            return
        }

        lastTypingRef.current = now
        socketRef.current?.emit("chat:typing", { name, room })
    }

    // Trocar de sala: sai da antiga e entra na nova (o feed de cada sala fica guardado)
    function aoTrocarSala(event: MouseEvent<HTMLButtonElement>) {
        const next = ROOMS.find(item => item === event.currentTarget.dataset.room)

        if (!next || next === room) {
            return
        }

        socketRef.current?.emit("chat:leave", { name, room })
        socketRef.current?.emit("chat:join", { name, room: next })
        roomRef.current = next
        setRoom(next)
        setTypingNames([])
    }

    // Sair da sala: avisa a sala, desliga o túnel (efeito 1) e volta para a tela do nome
    function aoSair() {
        socketRef.current?.emit("chat:leave", { name, room })
        setIsJoined(false)
        setIsConnected(false)
        setFeed(EMPTY_FEED)
        setTypingNames([])
        setIsSending(false)
        setImageError("")
        roomRef.current = "geral"
        setRoom("geral")
    }

    // Clique no 📎: abre o seletor de arquivo escondido
    function aoClicarAnexo() {
        fileInputRef.current?.click()
    }

    // Arquivo escolhido: valida o tamanho e lê como dataURL (base64) para emitir chat:image
    function aoEscolherImagem(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]

        // Limpa o input para poder escolher o mesmo arquivo de novo
        event.target.value = ""

        if (!file || !isConnected) {
            return
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setImageError("A imagem passa de 500 KB e não foi enviada.")
            return
        }

        setImageError("")

        const reader = new FileReader()

        reader.onload = () => {
            if (typeof reader.result !== "string") {
                return
            }

            setIsSending(true)
            socketRef.current?.emit("chat:image", { name, room, filename: file.name, data: reader.result })
        }

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

    const roomFeed = feed[room]
    const powerLevel = online.length * 3000
    const isOver9000 = powerLevel > 9000
    const statusClass = isConnected ? "text-bg-success" : "text-bg-secondary"
    const statusLabel = isConnected ? "conectado" : "conectando..."

    return (
        <>
        <div className={`card room-${room}`}>
            <div className="card-header d-flex justify-content-between align-items-center">
                <strong>Sala #{room} · {name}</strong>
                <span className={`badge ${statusClass}`}>{statusLabel}</span>
            </div>

            <div className="card-header d-flex justify-content-between align-items-center border-top-0">
                <div className="btn-group btn-group-sm" role="group" aria-label="Salas">
                    {ROOMS.map(item => (
                        <button
                            key={item}
                            type="button"
                            className={`btn ${item === room ? "btn-primary" : "btn-outline-primary"}`}
                            data-room={item}
                            onClick={aoTrocarSala}
                        >
                            # {item}
                        </button>
                    ))}
                </div>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={aoSair}>Sair da sala</button>
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

                    if (item.kind === "left") {
                        const who = item.left.name

                        return (
                            <p key={`left-${item.left.sentAt}-${item.left.name}`} className="text-center my-2">
                                {/* Aviso de saída: cor própria (amarelo), diferente do verde de "entrou" */}
                                <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-normal px-3 py-2">
                                    ⇦ {who} saiu da sala · {formatTime(item.left.sentAt)}
                                </span>
                            </p>
                        )
                    }

                    if (item.kind === "image") {
                        const image = item.image
                        const isMineImage = image.name === name
                        const alignImage = isMineImage ? "align-items-end" : "align-items-start"

                        return (
                            <div key={`image-${image.sentAt}-${image.name}-${image.filename}`} className={`d-flex flex-column ${alignImage} mb-2`}>
                                <small className="text-muted">{isMineImage ? "você" : image.name} enviou uma imagem · {formatTime(image.sentAt)}</small>
                                <img className="chat-image rounded-3 border" src={image.thumb} alt={image.filename} style={{ maxWidth: "75%" }} />
                            </div>
                        )
                    }

                    const message = item.message
                    const isMine = message.name === name
                    const align = isMine ? "align-items-end" : "align-items-start"
                    const bubble = isMine ? "bg-primary text-white" : "bg-light"
                    const isEmoji = EMOJIS.some(emojiItem => emojiItem.emoji === message.text)
                    const size = isEmoji ? "fs-1" : ""
                    const attack = findAttack(message.text)
                    const attackClass = attack ? `has-attack-${attack.kind}` : ""
                    const mineClass = isMine ? "is-mine" : "is-other"

                    return (
                        <div key={`${message.sentAt}-${message.name}-${message.text}`} className={`d-flex flex-column ${align} mb-2`}>
                            <small className="text-muted">{isMine ? "você" : message.name} · {formatTime(message.sentAt)}</small>
                            {attack && <span className={`attack-label attack-${attack.kind}`}>{attack.label}</span>}
                            <span className={`chat-bubble ${mineClass} ${attackClass} rounded-3 px-3 py-2 ${bubble} ${size}`} style={{ maxWidth: "75%" }}>{message.text}</span>
                        </div>
                    )
                })}

                <div ref={endRef} />
            </div>

            <div className="reactions card-footer d-flex gap-2 pb-0 border-top-0 align-items-center">
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
                <input ref={fileInputRef} type="file" accept="image/*" className="d-none" onChange={aoEscolherImagem} />
                <button type="button" className="btn btn-outline-secondary btn-sm ms-auto" disabled={!isConnected} onClick={aoClicarAnexo}>📎 imagem</button>
            </div>

            <div className="card-footer border-top-0 py-1 small" style={{ minHeight: "2rem" }}>
                {typingNames.length > 0 && <span className="typing-notice fst-italic">{formatTyping(typingNames)}</span>}
                {imageError && <span className="text-danger ms-2">{imageError}</span>}
                {isSending && <span className="text-muted ms-2">Enviando imagem…</span>}
            </div>

            <form className="card-footer d-flex gap-2" onSubmit={aoEnviar}>
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

            <p className="attack-hint mb-0 pb-2">Dica: grite kamehameha, rasengan, bankai ou "over 9000" 👀</p>
        </div>

        <div className="card mt-3">
            <div className="card-header">
                <strong>Online agora ({online.length})</strong>
                <span className={`badge power-badge ${isOver9000 ? "is-over-9000" : ""}`}>
                    ⚡ Nível de poder: {powerLevel}{isOver9000 ? " · É OVER 9000!!!" : ""}
                </span>
            </div>

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
