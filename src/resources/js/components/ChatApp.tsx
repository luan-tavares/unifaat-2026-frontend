import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent, MouseEvent } from "react"
import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"
import type { ChatFeedItem, ChatJoin, ChatLeave, ChatMessage, ChatImage, ChatTyping, OnlineUser } from "../types/chat"

// Os botões de reação: clicar manda o emoji como mensagem
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

// O chat (sem login): primeiro o nome, depois a sala. As mensagens chegam pelo túnel WebSocket
// (nginx → websocket → RabbitMQ) e o React só mostra o estado.
export function ChatApp() {
    const [nameDraft, setNameDraft] = useState("")
    const [name, setName] = useState("")
    const [isJoined, setIsJoined] = useState(false)
    const [currentRoom, setCurrentRoom] = useState<Room>("geral")
    const [feedByRoom, setFeedByRoom] = useState<Record<Room, ChatFeedItem[]>>({
        geral: [],
        dev: []
    })
    const [text, setText] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [online, setOnline] = useState<OnlineUser[]>([])
    const [typingUsers, setTypingUsers] = useState<string[]>([])

    // Referências: o socket vive no heap (não renderiza) e o fim da lista é um elemento do HTML
    const socketRef = useRef<Socket | null>(null)
    const endRef = useRef<HTMLDivElement>(null)
    const lastTypingEmitRef = useRef<number>(0)
    const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({})
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Efeito 1: depois de entrar na sala, abre o túnel; a limpeza fecha a conexão
    useEffect(() => {
        if (!isJoined) {
            return
        }

        // Só WebSocket (sem polling): o nginx reparte as conexões entre as réplicas sem precisar de sticky
        const socket = io({ transports: ["websocket"] })

        // Ao conectar (e ao reconectar) o client diz o nome: o servidor guarda no socket e publica a presença
        const aoConectar = () => {
            setIsConnected(true)
            socket.emit("chat:join", { name, room: currentRoom })
        }
        const aoDesconectar = () => setIsConnected(false)
        
        const aoReceber = (message: ChatMessage) => {
            setFeedByRoom(current => ({
                ...current,
                [message.room]: [...current[message.room as Room], { kind: "message", message }]
            }))
            
            // Remove o aviso de digitando quando a mensagem dessa pessoa chega
            setTypingUsers(current => current.filter(n => n !== message.name))
            if (typingTimeoutRef.current[message.name]) {
                clearTimeout(typingTimeoutRef.current[message.name])
                delete typingTimeoutRef.current[message.name]
            }
        }
        
        const aoEntrarAlguem = (join: ChatJoin) => {
            setFeedByRoom(current => ({
                ...current,
                [join.room]: [...current[join.room as Room], { kind: "join", join }]
            }))
        }
        
        const aoSairAlguem = (leave: ChatLeave) => {
            setFeedByRoom(current => ({
                ...current,
                [leave.room]: [...current[leave.room as Room], { kind: "leave", leave }]
            }))
        }
        
        const aoReceberOnline = (users: OnlineUser[]) => setOnline(users)
        
        const aoReceberTyping = (typing: ChatTyping) => {
            // Não mostra "você está digitando..."
            if (typing.name === name || typing.room !== currentRoom) {
                return
            }

            // Adiciona o usuário à lista de digitando
            setTypingUsers(current => {
                if (current.includes(typing.name)) {
                    return current
                }
                return [...current, typing.name]
            })

            // Remove o aviso depois de 3 segundos
            if (typingTimeoutRef.current[typing.name]) {
                clearTimeout(typingTimeoutRef.current[typing.name])
            }

            typingTimeoutRef.current[typing.name] = setTimeout(() => {
                setTypingUsers(current => current.filter(n => n !== typing.name))
                delete typingTimeoutRef.current[typing.name]
            }, 3000)
        }

        const aoReceberImagem = (image: ChatImage) => {
            setFeedByRoom(current => ({
                ...current,
                [image.room]: [...current[image.room as Room], { kind: "image", image }]
            }))
        }

        socket.on("connect", aoConectar)
        socket.on("disconnect", aoDesconectar)
        socket.on("chat:message", aoReceber)
        socket.on("chat:joined", aoEntrarAlguem)
        socket.on("chat:left", aoSairAlguem)
        socket.on("presence:list", aoReceberOnline)
        socket.on("chat:typing", aoReceberTyping)
        socket.on("chat:image", aoReceberImagem)

        socketRef.current = socket

        return () => {
            socket.off("connect", aoConectar)
            socket.off("disconnect", aoDesconectar)
            socket.off("chat:message", aoReceber)
            socket.off("chat:joined", aoEntrarAlguem)
            socket.off("chat:left", aoSairAlguem)
            socket.off("presence:list", aoReceberOnline)
            socket.off("chat:typing", aoReceberTyping)
            socket.off("chat:image", aoReceberImagem)
            socket.disconnect()
        }
    }, [isJoined, name, currentRoom])

    // Efeito 2: depois de a tela atualizar com a mensagem nova, rola até o fim
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [feedByRoom, currentRoom])

    // Efeito 3: limpa os timeouts de digitando na desmontagem
    useEffect(() => {
        return () => {
            Object.values(typingTimeoutRef.current).forEach(clearTimeout)
        }
    }, [])

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

    // Trocar de sala: sai da antiga e entra na nova
    function aoTrocarSala(room: Room) {
        if (room === currentRoom || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:leave", { name, room: currentRoom })
        setCurrentRoom(room)
        socketRef.current?.emit("chat:join", { name, room })
    }

    // Sair da sala: volta para a tela do nome
    function aoSair() {
        if (!isConnected) {
            return
        }

        socketRef.current?.emit("chat:leave", { name, room: currentRoom })
        setIsJoined(false)
        setName("")
        setNameDraft("")
        setFeedByRoom({ geral: [], dev: [] })
        setTypingUsers([])
    }

    // Enviar: emite pelo túnel e limpa o campo; a mensagem só aparece quando VOLTA do exchange
    function aoEnviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmed = text.trim()

        if (!trimmed || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, room: currentRoom, text: trimmed })
        setText("")
    }

    // Clique no emoji: o handler lê qual foi (data-emoji) e emite pelo túnel, igual ao envio do texto
    function aoClicarEmoji(event: MouseEvent<HTMLButtonElement>) {
        const emoji = event.currentTarget.dataset.emoji

        if (!emoji || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, room: currentRoom, text: emoji })
    }

    // Digitando: emite no máximo 1 vez a cada ~1,5 s
    function aoDigitar(event: ChangeEvent<HTMLInputElement>) {
        setText(event.target.value)

        const now = Date.now()
        const elapsed = now - lastTypingEmitRef.current

        if (elapsed >= 1500 && isConnected) {
            socketRef.current?.emit("chat:typing", { name, room: currentRoom })
            lastTypingEmitRef.current = now
        }
    }

    // Upload de imagem
    function aoClicarAnexar() {
        fileInputRef.current?.click()
    }

    function aoSelecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]

        if (!file || !isConnected) {
            return
        }

        // Valida o tamanho (máximo 500 KB)
        if (file.size > MAX_IMAGE_SIZE) {
            alert(`Imagem muito grande! O tamanho máximo é ${MAX_IMAGE_SIZE / 1024} KB.`)
            event.target.value = ""
            return
        }

        // Lê o arquivo como dataURL
        const reader = new FileReader()

        reader.onload = () => {
            const data = reader.result as string

            socketRef.current?.emit("chat:image", {
                name,
                room: currentRoom,
                filename: file.name,
                data
            })

            event.target.value = ""
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
    const feed = feedByRoom[currentRoom]

    const typingMessage = (() => {
        if (typingUsers.length === 0) {
            return ""
        }

        if (typingUsers.length === 1) {
            return `${typingUsers[0]} está digitando...`
        }

        if (typingUsers.length === 2) {
            return `${typingUsers[0]} e ${typingUsers[1]} estão digitando...`
        }

        return `${typingUsers.slice(0, -1).join(", ")} e ${typingUsers[typingUsers.length - 1]} estão digitando...`
    })()

    return (
        <>
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <div className="d-flex gap-2 align-items-center">
                    {ROOMS.map(room => (
                        <button
                            key={room}
                            type="button"
                            className={`btn btn-sm ${currentRoom === room ? "btn-primary" : "btn-outline-primary"}`}
                            disabled={!isConnected}
                            onClick={() => aoTrocarSala(room)}
                        >
                            # {room}
                        </button>
                    ))}
                    <span className="text-muted">·</span>
                    <strong>{name}</strong>
                </div>
                <div className="d-flex gap-2 align-items-center">
                    <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={aoSair}
                    >
                        Sair da sala
                    </button>
                </div>
            </div>

            <div className="card-body" style={{ height: "55vh", overflowY: "auto" }}>
                {feed.length === 0 && <p className="text-muted">Nenhuma mensagem ainda. Escreva a primeira.</p>}

                {feed.map((item, index) => {
                    if (item.kind === "join") {
                        const who = item.join.name === name ? "Você" : item.join.name

                        return (
                            <p key={`join-${item.join.sentAt}-${item.join.name}-${index}`} className="text-center my-2">
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
                            <p key={`leave-${item.leave.sentAt}-${item.leave.name}-${index}`} className="text-center my-2">
                                {/* Mensagem de sistema: cor diferente (amarelo) */}
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
                            <div key={`image-${item.image.sentAt}-${item.image.name}-${index}`} className={`d-flex flex-column ${align} mb-2`}>
                                <small className="text-muted">{isMine ? "você" : item.image.name} · {formatTime(item.image.sentAt)}</small>
                                <div className="d-flex flex-column gap-1" style={{ maxWidth: "75%" }}>
                                    <small className="text-muted">{item.image.filename}</small>
                                    <img src={item.image.thumb} alt={item.image.filename} className="rounded-3" style={{ maxWidth: "100%", maxHeight: "300px" }} />
                                </div>
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
                        <div key={`message-${message.sentAt}-${message.name}-${message.text}-${index}`} className={`d-flex flex-column ${align} mb-2`}>
                            <small className="text-muted">{isMine ? "você" : message.name} · {formatTime(message.sentAt)}</small>
                            <span className={`rounded-3 px-3 py-2 ${bubble} ${size}`} style={{ maxWidth: "75%" }}>{message.text}</span>
                        </div>
                    )
                })}

                <div ref={endRef} />
            </div>

            {typingMessage && (
                <div className="card-footer border-bottom-0 py-2">
                    <small className="text-muted fst-italic">{typingMessage}</small>
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
                    className="btn btn-outline-secondary py-0"
                    title="Anexar imagem"
                    aria-label="Anexar imagem"
                    disabled={!isConnected}
                    onClick={aoClicarAnexar}
                >
                    📎 imagem
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
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
        </>
    )
}
