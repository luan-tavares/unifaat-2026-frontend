import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent, MouseEvent } from "react"
import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"
import { ROOMS } from "../types/chat"
import type {
    ChatFeedItem,
    ChatImage,
    ChatImageError,
    ChatImageQueued,
    ChatImageUpload,
    ChatJoin,
    ChatLeave,
    ChatMessage,
    ChatRoom,
    ChatTyping,
    OnlineUser,
} from "../types/chat"

// Os golpes dos personagens: clicar manda o golpe como mensagem (texto "emoji + nome do golpe!").
// Quem recebe reconhece o texto e mostra o cartão do golpe, com a cor e a animação de cada um.
const ATTACKS = [
    { id: "getsuga", emoji: "🌙", attack: "Getsuga Tenshō", fighter: "Ichigo Kurosaki", tone: "getsuga" },
    { id: "senbonzakura", emoji: "🌸", attack: "Senbonzakura Kageyoshi", fighter: "Byakuya Kuchiki", tone: "sakura" },
    { id: "zabimaru", emoji: "🐍", attack: "Hihiō Zabimaru", fighter: "Renji Abarai", tone: "zabimaru" },
    { id: "shirayuki", emoji: "❄️", attack: "Tsugi no Mai: Hakuren", fighter: "Rukia Kuchiki", tone: "ice" },
    { id: "hyorinmaru", emoji: "🐉", attack: "Daiguren Hyōrinmaru", fighter: "Tōshirō Hitsugaya", tone: "ice" },
    { id: "kurohitsugi", emoji: "⬛", attack: "Hadō 90: Kurohitsugi", fighter: "Sōsuke Aizen", tone: "kido" },
    { id: "cero", emoji: "💀", attack: "Cero", fighter: "Hollow", tone: "cero" },
]

function attackText(item: { emoji: string, attack: string }): string {
    return `${item.emoji} ${item.attack}!`
}

// "digitando…": no máximo 1 aviso a cada 1,5 s; o aviso some sozinho depois de 3 s sem um novo
const TYPING_THROTTLE_MS = 1500
const TYPING_VISIBLE_MS = 3000

// Imagem: limite de 500 KB (acima disso o client recusa e não envia)
const MAX_IMAGE_BYTES = 500 * 1024

function formatTime(sentAt: number): string {
    return new Date(sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

function formatKb(bytes: number): string {
    return `${Math.round(bytes / 1024)} KB`
}

// "ana está digitando…" · "ana e beto estão digitando…" · "ana, beto e caio estão digitando…"
function typingLabel(names: string[]): string {
    if (names.length === 0) {
        return ""
    }

    if (names.length === 1) {
        return `${names[0]} está digitando…`
    }

    const last = names[names.length - 1]
    const others = names.slice(0, -1).join(", ")

    return `${others} e ${last} estão digitando…`
}

function toRoom(value: string | undefined): ChatRoom | null {
    return ROOMS.find(room => room === value) ?? null
}

// O chat (sem login): primeiro o nome, depois a sala (# geral ou # dev). As mensagens chegam pelo túnel
// WebSocket (nginx → websocket → RabbitMQ) e o React só mostra o estado.
export function ChatApp() {
    const [nameDraft, setNameDraft] = useState("")
    const [name, setName] = useState("")
    const [isJoined, setIsJoined] = useState(false)
    const [room, setRoom] = useState<ChatRoom>("geral")
    const [feed, setFeed] = useState<ChatFeedItem[]>([])
    const [text, setText] = useState("")
    const [isConnected, setIsConnected] = useState(false)
    const [online, setOnline] = useState<OnlineUser[]>([])
    const [typingNames, setTypingNames] = useState<string[]>([])
    const [isSendingImage, setIsSendingImage] = useState(false)
    const [imageNotice, setImageNotice] = useState("")
    const [imageError, setImageError] = useState("")

    // Referências: vivem no heap e não renderizam a tela
    const socketRef = useRef<Socket | null>(null)
    const endRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    // A sala atual também numa ref: ao (re)conectar, o handler do socket precisa da sala do momento
    const roomRef = useRef<ChatRoom>("geral")
    // Horário do último chat:typing enviado (o limite de 1 a cada 1,5 s)
    const lastTypingRef = useRef(0)
    // Um timer por pessoa digitando: o aviso dela some sozinho em 3 s
    const typingTimersRef = useRef<Map<string, number>>(new Map())
    // Contador para o id dos itens do feed (key estável, sem depender do índice)
    const nextIdRef = useRef(0)

    // Efeito 1: depois de entrar, abre o túnel; a limpeza tira os listeners, os timers e fecha a conexão
    useEffect(() => {
        if (!isJoined) {
            return
        }

        // Só WebSocket (sem polling): o nginx reparte as conexões entre as réplicas sem precisar de sticky
        const socket = io({ transports: ["websocket"] })
        const timers = typingTimersRef.current

        function makeId(): string {
            nextIdRef.current += 1
            return String(nextIdRef.current)
        }

        // Tira uma pessoa do "digitando…" (o timer dela acabou ou a mensagem dela chegou)
        function stopTyping(who: string) {
            const timer = timers.get(who)

            if (timer !== undefined) {
                window.clearTimeout(timer)
                timers.delete(who)
            }

            setTypingNames(current => current.filter(item => item !== who))
        }

        // Ao conectar (e ao reconectar) o client diz o nome e a sala: o servidor coloca o socket na sala
        function handleConnect() {
            setIsConnected(true)
            socket.emit("chat:join", { name, room: roomRef.current })
        }

        function handleDisconnect() {
            setIsConnected(false)
        }

        function handleMessage(message: ChatMessage) {
            stopTyping(message.name)
            setFeed(current => [...current, { id: makeId(), room: message.room, kind: "message", message }])
        }

        function handleJoined(join: ChatJoin) {
            setFeed(current => [...current, { id: makeId(), room: join.room, kind: "join", join }])
        }

        function handleLeft(leave: ChatLeave) {
            stopTyping(leave.name)
            setFeed(current => [...current, { id: makeId(), room: leave.room, kind: "leave", leave }])
        }

        // Alguém da sala está digitando: nunca mostra o próprio aviso; cada aviso novo renova os 3 s
        function handleTyping(typing: ChatTyping) {
            if (typing.name === name || typing.room !== roomRef.current) {
                return
            }

            const who = typing.name
            const timer = timers.get(who)

            if (timer !== undefined) {
                window.clearTimeout(timer)
            }

            timers.set(who, window.setTimeout(() => stopTyping(who), TYPING_VISIBLE_MS))
            setTypingNames(current => (current.includes(who) ? current : [...current, who]))
        }

        // A miniatura voltou do worker (exchange "results"): entra no feed da sala
        function handleImage(image: ChatImage) {
            setFeed(current => [...current, { id: makeId(), room: image.room, kind: "image", image }])

            if (image.name !== name) {
                return
            }

            setIsSendingImage(false)
            setImageNotice("")
        }

        function handleImageQueued(queued: ChatImageQueued) {
            setImageNotice(`"${queued.filename}" está na fila do 12º Esquadrão: aguardando o worker gerar a miniatura…`)
        }

        function handleImageError(error: ChatImageError) {
            setIsSendingImage(false)
            setImageNotice("")
            setImageError(error.message)
        }

        function handlePresence(users: OnlineUser[]) {
            setOnline(users)
        }

        socket.on("connect", handleConnect)
        socket.on("disconnect", handleDisconnect)
        socket.on("chat:message", handleMessage)
        socket.on("chat:joined", handleJoined)
        socket.on("chat:left", handleLeft)
        socket.on("chat:typing", handleTyping)
        socket.on("chat:image", handleImage)
        socket.on("chat:image:queued", handleImageQueued)
        socket.on("chat:image:error", handleImageError)
        socket.on("presence:list", handlePresence)

        socketRef.current = socket

        return () => {
            socket.off("connect", handleConnect)
            socket.off("disconnect", handleDisconnect)
            socket.off("chat:message", handleMessage)
            socket.off("chat:joined", handleJoined)
            socket.off("chat:left", handleLeft)
            socket.off("chat:typing", handleTyping)
            socket.off("chat:image", handleImage)
            socket.off("chat:image:queued", handleImageQueued)
            socket.off("chat:image:error", handleImageError)
            socket.off("presence:list", handlePresence)
            socket.disconnect()
            socketRef.current = null

            for (const timer of timers.values()) {
                window.clearTimeout(timer)
            }

            timers.clear()
            setTypingNames([])
            setIsConnected(false)
        }
    }, [isJoined, name])

    // Efeito 2: depois de a tela atualizar com um item novo, rola até o fim
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [feed, room])

    // Limpa os avisos que dependem da sala (digitando e imagem em andamento)
    function resetRoomState() {
        for (const timer of typingTimersRef.current.values()) {
            window.clearTimeout(timer)
        }

        typingTimersRef.current.clear()
        setTypingNames([])
        setIsSendingImage(false)
        setImageNotice("")
        setImageError("")
    }

    function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
        setNameDraft(event.target.value)
    }

    // Entrar: guarda o nome e liga o efeito do túnel (a sala atual vai no chat:join)
    function handleEnter(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmed = nameDraft.trim()

        if (!trimmed) {
            return
        }

        setName(trimmed)
        setIsJoined(true)
    }

    // Trocar de sala: sai da antiga (chat:leave) e entra na nova (chat:join), sem fechar o túnel
    function handleSwitchRoom(event: MouseEvent<HTMLButtonElement>) {
        const nextRoom = toRoom(event.currentTarget.dataset.room)

        if (!nextRoom || nextRoom === room) {
            return
        }

        socketRef.current?.emit("chat:leave", { name, room })
        socketRef.current?.emit("chat:join", { name, room: nextRoom })

        roomRef.current = nextRoom
        lastTypingRef.current = 0
        resetRoomState()
        setRoom(nextRoom)
    }

    // Sair da sala: avisa quem ficou e volta para a tela do nome (o efeito fecha o túnel na limpeza)
    function handleLeave() {
        socketRef.current?.emit("chat:leave", { name, room })

        resetRoomState()
        setFeed([])
        setOnline([])
        setIsJoined(false)
    }

    // Digitar: atualiza o campo e avisa a sala, mas no máximo 1 vez a cada 1,5 s (nunca a cada tecla)
    function handleTextChange(event: ChangeEvent<HTMLInputElement>) {
        setText(event.target.value)

        const now = Date.now()

        if (!isConnected || now - lastTypingRef.current < TYPING_THROTTLE_MS) {
            return
        }

        lastTypingRef.current = now
        socketRef.current?.emit("chat:typing", { name, room })
    }

    // Enviar: emite pelo túnel e limpa o campo; a mensagem só aparece quando VOLTA do exchange
    function handleSend(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmed = text.trim()

        if (!trimmed || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, room, text: trimmed })
        lastTypingRef.current = 0
        setText("")
    }

    // Clique no golpe: o handler lê qual foi (data-attack) e emite pelo túnel, igual ao envio do texto
    function handleAttack(event: MouseEvent<HTMLButtonElement>) {
        const attack = ATTACKS.find(item => item.id === event.currentTarget.dataset.attack)

        if (!attack || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, room, text: attackText(attack) })
    }

    // "📎 imagem": abre o seletor de arquivo escondido
    function handleChooseImage() {
        setImageError("")
        fileInputRef.current?.click()
    }

    // Escolheu o arquivo: valida o tamanho, lê como dataURL (base64) e emite chat:image.
    // O processamento (miniatura) NÃO acontece aqui nem no websocket: vai para o worker.
    function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
        const input = event.currentTarget
        const file = input.files?.[0]

        // Limpa o input para o mesmo arquivo poder ser escolhido de novo
        input.value = ""

        if (!file) {
            return
        }

        if (!file.type.startsWith("image/")) {
            setImageError(`"${file.name}" não é uma imagem.`)
            return
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setImageError(`"${file.name}" tem ${formatKb(file.size)}: o limite é 500 KB. A imagem não foi enviada.`)
            return
        }

        const reader = new FileReader()
        const roomAtSend = room

        reader.onload = () => {
            if (typeof reader.result !== "string") {
                return
            }

            const upload: ChatImageUpload = { name, room: roomAtSend, filename: file.name, data: reader.result }

            socketRef.current?.emit("chat:image", upload)
        }

        reader.onerror = () => {
            setIsSendingImage(false)
            setImageNotice("")
            setImageError(`Não foi possível ler "${file.name}".`)
        }

        setImageError("")
        setIsSendingImage(true)
        setImageNotice(`A borboleta infernal está levando "${file.name}"…`)
        reader.readAsDataURL(file)
    }

    if (!isJoined) {
        return (
            <form className="card" onSubmit={handleEnter}>
                <div className="card-body d-flex flex-column gap-3">
                    <label className="form-label mb-0 d-flex align-items-center gap-2" htmlFor="chat-name">
                        <span className="kanji" aria-hidden="true">名前</span>
                        <strong>Seu nome de shinigami</strong>
                    </label>
                    <input
                        id="chat-name"
                        className="form-control"
                        value={nameDraft}
                        onChange={handleNameChange}
                        placeholder="Ex.: Ichigo, Rukia, Renji…"
                        maxLength={30}
                        autoFocus
                    />
                    <button className="btn btn-primary" type="submit">Entrar na sala</button>
                </div>
            </form>
        )
    }

    const statusClass = isConnected ? "text-bg-success" : "text-bg-secondary"
    const statusLabel = isConnected ? "reiatsu estável" : "sentindo a reiatsu..."
    const roomFeed = feed.filter(item => item.room === room)
    const typingText = typingLabel(typingNames)

    return (
        <>
        <div className="card">
            <div className="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <span className="kanji" aria-hidden="true">伝令</span>
                    <strong>Sala #{room} · {name}</strong>
                    <span className={`badge ${statusClass}`}>{statusLabel}</span>
                </div>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleLeave}>
                    Sair da sala
                </button>
            </div>

            <div className="card-header bg-body d-flex gap-2">
                {ROOMS.map(item => {
                    const isActive = item === room
                    const buttonClass = isActive ? "btn-primary" : "btn-outline-primary"

                    return (
                        <button
                            key={item}
                            type="button"
                            className={`btn btn-sm ${buttonClass}`}
                            data-room={item}
                            aria-pressed={isActive}
                            disabled={!isConnected}
                            onClick={handleSwitchRoom}
                        >
                            # {item}
                        </button>
                    )
                })}
            </div>

            <div className="card-body chat-feed" style={{ height: "55vh", overflowY: "auto" }}>
                {roomFeed.length === 0 && <p className="text-muted fst-italic">Silêncio na #{room}. Solte a primeira borboleta infernal.</p>}

                {roomFeed.map(item => {
                    if (item.kind === "join") {
                        const who = item.join.name === name ? "Você" : item.join.name

                        return (
                            <p key={item.id} className="chat-item text-center my-2">
                                {/* Mensagem de sistema: cor própria (verde), diferente das bolhas dos participantes */}
                                <span className="badge rounded-pill bg-success-subtle text-success-emphasis fw-normal px-3 py-2">
                                    🦋 {who} entrou na sala · {formatTime(item.join.sentAt)}
                                </span>
                            </p>
                        )
                    }

                    if (item.kind === "leave") {
                        return (
                            <p key={item.id} className="chat-item text-center my-2">
                                {/* "saiu": outra cor (amarelo), para não confundir com "entrou" */}
                                <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-normal px-3 py-2">
                                    💨 {item.leave.name} saiu da sala · {formatTime(item.leave.sentAt)}
                                </span>
                            </p>
                        )
                    }

                    if (item.kind === "image") {
                        const image = item.image
                        const isMine = image.name === name
                        const align = isMine ? "align-items-end" : "align-items-start"

                        return (
                            <div key={item.id} className={`chat-item d-flex flex-column ${align} mb-2`}>
                                <small className="text-muted">
                                    {isMine ? "você enviou" : `${image.name} enviou`} uma imagem · {formatTime(image.sentAt)}
                                </small>
                                <img
                                    src={image.thumb}
                                    alt={image.filename}
                                    title={image.filename}
                                    className={isMine ? "chat-image mine" : "chat-image"}
                                />
                            </div>
                        )
                    }

                    const message = item.message
                    const isMine = message.name === name
                    const align = isMine ? "align-items-end" : "align-items-start"
                    const bubble = isMine ? "chat-bubble mine" : "chat-bubble"
                    const attack = ATTACKS.find(attackItem => attackText(attackItem) === message.text)

                    if (attack) {
                        return (
                            <div key={item.id} className={`chat-item d-flex flex-column ${align} mb-2`}>
                                <small className="text-muted">{isMine ? "você" : message.name} · {formatTime(message.sentAt)}</small>
                                {/* Golpe: cartão com a cor do personagem e um corte de espada passando por cima */}
                                <div className={`attack-card tone-${attack.tone}`}>
                                    <span className="attack-emoji" aria-hidden="true">{attack.emoji}</span>
                                    <span className="d-flex flex-column">
                                        <span className="attack-call">{isMine ? "Você" : message.name} usou</span>
                                        <strong className="attack-name">{attack.attack}!</strong>
                                        <span className="attack-fighter">golpe de {attack.fighter}</span>
                                    </span>
                                </div>
                            </div>
                        )
                    }

                    return (
                        <div key={item.id} className={`chat-item d-flex flex-column ${align} mb-2`}>
                            <small className="text-muted">{isMine ? "você" : message.name} · {formatTime(message.sentAt)}</small>
                            <span className={`px-3 py-2 ${bubble}`}>{message.text}</span>
                        </div>
                    )
                })}

                <div ref={endRef} />
            </div>

            <div className="card-footer d-flex flex-wrap gap-2 pb-0 border-top-0">
                {ATTACKS.map(item => (
                    <button
                        key={item.id}
                        type="button"
                        className={`btn btn-outline-secondary attack-button tone-${item.tone}`}
                        data-attack={item.id}
                        title={`${item.attack} (${item.fighter})`}
                        aria-label={`Usar ${item.attack}, golpe de ${item.fighter}`}
                        disabled={!isConnected}
                        onClick={handleAttack}
                    >
                        <span aria-hidden="true">{item.emoji}</span> {item.attack}
                    </button>
                ))}

                <button
                    type="button"
                    className="btn btn-outline-secondary ms-auto"
                    disabled={!isConnected || isSendingImage}
                    onClick={handleChooseImage}
                >
                    📎 imagem
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={handleImageChange}
                />
            </div>

            {/* Avisos acima do campo: quem está digitando e o andamento da imagem */}
            <div className="card-footer border-top-0 py-1 small" style={{ minHeight: "1.75rem" }} aria-live="polite">
                {typingText !== "" && <span className="text-muted fst-italic">{typingText}</span>}
                {imageNotice !== "" && <span className="text-primary ms-2">🦋 {imageNotice}</span>}
                {imageError !== "" && <span className="text-danger ms-2">{imageError}</span>}
            </div>

            <form className="card-footer d-flex gap-2 border-top-0" onSubmit={handleSend}>
                <input
                    className="form-control"
                    value={text}
                    onChange={handleTextChange}
                    placeholder={`Mensagem para #${room}...`}
                    maxLength={500}
                    autoFocus
                />
                <button className="btn btn-primary" type="submit" disabled={!isConnected}>Enviar</button>
            </form>
        </div>

        <div className="card mt-3">
            <div className="card-header d-flex align-items-center gap-2">
                <span className="kanji" aria-hidden="true">隊士</span>
                <strong>Reiatsu detectada ({online.length})</strong>
            </div>

            <ul className="list-group list-group-flush">
                {online.length === 0 && <li className="list-group-item text-muted">Nenhuma reiatsu por perto.</li>}

                {online.map(user => {
                    const isMe = user.name === name

                    return (
                        <li key={user.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <span><span className="reiatsu-dot" aria-hidden="true" /> {user.name}{isMe ? " (você)" : ""}</span>
                            <code>{user.ip}</code>
                        </li>
                    )
                })}
            </ul>
        </div>
        </>
    )
}
