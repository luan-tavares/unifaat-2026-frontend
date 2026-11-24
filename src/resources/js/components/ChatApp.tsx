import { useEffect, useRef, useState } from "react"
import type { FormEvent, MouseEvent } from "react"
import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"
import type { ChatFeedItem, ChatJoin, ChatMessage, OnlineUser } from "../types/chat"
import { LoadButton } from "./LoadButton"
import { RecentMessages } from "./RecentMessages"

// Os golpes dos personagens (o tema Bleach do TF-10): clicar manda o golpe como mensagem ("emoji + nome do golpe!").
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

    // Referências: o socket vive no heap (não renderiza) e o fim da lista é um elemento do HTML
    const socketRef = useRef<Socket | null>(null)
    const listRef = useRef<HTMLDivElement>(null)

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
            socket.emit("chat:join", { name })
        }
        const aoDesconectar = () => setIsConnected(false)
        const aoReceber = (message: ChatMessage) => setFeed(current => [...current, { kind: "message", message }])
        const aoEntrarAlguem = (join: ChatJoin) => setFeed(current => [...current, { kind: "join", join }])
        const aoReceberOnline = (users: OnlineUser[]) => setOnline(users)

        socket.on("connect", aoConectar)
        socket.on("disconnect", aoDesconectar)
        socket.on("chat:message", aoReceber)
        socket.on("chat:joined", aoEntrarAlguem)
        socket.on("presence:list", aoReceberOnline)

        socketRef.current = socket

        return () => {
            socket.off("connect", aoConectar)
            socket.off("disconnect", aoDesconectar)
            socket.off("chat:message", aoReceber)
            socket.off("chat:joined", aoEntrarAlguem)
            socket.off("presence:list", aoReceberOnline)
            socket.disconnect()
        }
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

    // Enviar: emite pelo túnel e limpa o campo; a mensagem só aparece quando VOLTA do exchange
    function aoEnviar(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        const trimmed = text.trim()

        if (!trimmed || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, text: trimmed })
        setText("")
    }

    // Clique no golpe: o handler lê qual foi (data-attack) e emite pelo túnel, igual ao envio do texto
    function aoUsarGolpe(event: MouseEvent<HTMLButtonElement>) {
        const attack = ATTACKS.find(item => item.id === event.currentTarget.dataset.attack)

        if (!attack || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, text: attackText(attack) })
    }

    if (!isJoined) {
        return (
            <form className="card" onSubmit={aoEntrar}>
                <div className="card-body d-flex flex-column gap-3">
                    <label className="form-label mb-0 d-flex align-items-center gap-2" htmlFor="chat-name">
                        <span className="kanji" aria-hidden="true">名前</span>
                        <strong>Seu nome de shinigami</strong>
                    </label>
                    <input
                        id="chat-name"
                        className="form-control"
                        value={nameDraft}
                        onChange={event => setNameDraft(event.target.value)}
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

    return (
        <>
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <span className="kanji" aria-hidden="true">伝令</span>
                    <strong>Sala geral · {name}</strong>
                </div>
                <span className={`badge ${statusClass}`}>{statusLabel}</span>
            </div>

            <div ref={listRef} className="card-body chat-feed" style={{ height: "55vh", overflowY: "auto" }}>
                {feed.length === 0 && <p className="text-muted fst-italic">Silêncio na sala. Solte a primeira borboleta infernal.</p>}

                {feed.map(item => {
                    if (item.kind === "join") {
                        const who = item.join.name === name ? "Você" : item.join.name

                        return (
                            <p key={`join-${item.join.sentAt}-${item.join.name}`} className="chat-item text-center my-2">
                                {/* Mensagem de sistema: cor própria (verde), diferente das bolhas dos participantes */}
                                <span className="badge rounded-pill bg-success-subtle text-success-emphasis fw-normal px-3 py-2">
                                    🦋 {who} entrou na sala · {formatTime(item.join.sentAt)}
                                </span>
                            </p>
                        )
                    }

                    const message = item.message
                    const isMine = message.name === name
                    const align = isMine ? "align-items-end" : "align-items-start"
                    const bubble = isMine ? "chat-bubble mine" : "chat-bubble"
                    const attack = ATTACKS.find(attackItem => attackText(attackItem) === message.text)
                    const key = `${message.sentAt}-${message.name}-${message.text}`

                    if (attack) {
                        return (
                            <div key={key} className={`chat-item d-flex flex-column ${align} mb-2`}>
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
                        <div key={key} className={`chat-item d-flex flex-column ${align} mb-2`}>
                            <small className="text-muted">{isMine ? "você" : message.name} · {formatTime(message.sentAt)}</small>
                            <span className={`px-3 py-2 ${bubble}`}>{message.text}</span>
                        </div>
                    )
                })}

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
                        onClick={aoUsarGolpe}
                    >
                        <span aria-hidden="true">{item.emoji}</span> {item.attack}
                    </button>
                ))}
            </div>

            <form className="card-footer d-flex gap-2" onSubmit={aoEnviar}>
                <input
                    className="form-control"
                    value={text}
                    onChange={event => setText(event.target.value)}
                    placeholder="Digite uma mensagem..."
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

        <RecentMessages />

        <LoadButton />
        </>
    )
}
