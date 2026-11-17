import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ChangeEvent, FormEvent, MouseEvent } from "react"
import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"
import { CHAT_ROOMS } from "../types/chat"
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

// Intervalo mínimo entre dois chat:typing do mesmo cliente. Sem isso, cada tecla
// vira uma publicação no RabbitMQ — uma frase de 40 letras custaria 40 eventos
// distribuídos para todas as réplicas.
const INTERVALO_TYPING_MS = 1500

// Quanto tempo o aviso "está digitando…" sobrevive sem um chat:typing novo.
// Precisa ser maior que o intervalo acima, senão o aviso pisca entre um envio e
// o seguinte enquanto a pessoa ainda digita.
const VALIDADE_TYPING_MS = 3000

// 500 KB. O mesmo limite existe no Event, no servidor: este aqui poupa a rede,
// aquele impede que alguém contorne a tela.
const LIMITE_IMAGEM_BYTES = 500 * 1024

function formatTime(sentAt: number): string {
    return new Date(sentAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
}

// "ana está digitando…" / "ana e beto estão digitando…" / "3 pessoas estão digitando…"
function frasesDigitando(nomes: readonly string[]): string {
    if (nomes.length === 1) {
        return `${nomes[0]} está digitando…`
    }

    if (nomes.length === 2) {
        return `${nomes[0]} e ${nomes[1]} estão digitando…`
    }

    return `${nomes.length} pessoas estão digitando…`
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
    const [typingNames, setTypingNames] = useState<readonly string[]>([])
    const [imageError, setImageError] = useState("")

    // Referências: o socket vive no heap (não renderiza) e o fim da lista é um elemento do HTML
    const socketRef = useRef<Socket | null>(null)
    const endRef = useRef<HTMLDivElement>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    // Horário do último chat:typing enviado. Fica em ref, e não em state, porque
    // mudar esse valor não precisa redesenhar nada — e um setState a cada tecla
    // seria exatamente o custo que estamos tentando evitar.
    const ultimoTypingRef = useRef(0)

    // Um timer por pessoa que está digitando. Em ref pelo mesmo motivo, e porque
    // a limpeza do efeito precisa alcançar os timers que ainda estão pendentes.
    const timersTypingRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    // O nome atual visto de dentro dos handlers do socket. Sem isso, o handler
    // registrado no efeito enxergaria o `name` do primeiro render.
    const nameRef = useRef(name)
    nameRef.current = name

    const limparTypingDe = useCallback((quem: string) => {
        const timer = timersTypingRef.current.get(quem)

        if (timer) {
            clearTimeout(timer)
            timersTypingRef.current.delete(quem)
        }

        setTypingNames(atual => atual.filter(nome => nome !== quem))
    }, [])

    // Efeito 1: depois de entrar na sala, abre o túnel; a limpeza fecha a conexão
    useEffect(() => {
        if (!isJoined) {
            return
        }

        // Só WebSocket (sem polling): o nginx reparte as conexões entre as réplicas sem precisar de sticky
        const socket = io({ transports: ["websocket"] })

        // Ao conectar (e ao reconectar) o client diz o nome e a sala: o servidor
        // guarda no socket, faz o socket.join e publica a presença
        const aoConectar = () => {
            setIsConnected(true)
            socket.emit("chat:join", { name, room })
        }
        const aoDesconectar = () => setIsConnected(false)

        const aoReceber = (message: ChatMessage) => {
            // A mensagem de alguém encerra o aviso de digitação dessa pessoa:
            // ela parou de digitar porque enviou.
            limparTypingDe(message.name)
            setFeed(current => [...current, { kind: "message", message }])
        }

        const aoEntrarAlguem = (join: ChatJoin) => setFeed(current => [...current, { kind: "join", join }])
        const aoSairAlguem = (leave: ChatLeave) => {
            limparTypingDe(leave.name)
            setFeed(current => [...current, { kind: "leave", leave }])
        }

        const aoReceberImagem = (image: ChatImage) => setFeed(current => [...current, { kind: "image", image }])
        const aoReceberOnline = (users: OnlineUser[]) => setOnline(users)

        const aoReceberTyping = (typing: ChatTyping) => {
            // O próprio autor nunca vê o aviso: ele sabe que está digitando.
            if (typing.name === nameRef.current) {
                return
            }

            setTypingNames(atual => (atual.includes(typing.name) ? atual : [...atual, typing.name]))

            // Cada chat:typing novo empurra o prazo para frente. O timer antigo
            // é cancelado, senão o primeiro a expirar apagaria o aviso mesmo com
            // a pessoa ainda digitando.
            const anterior = timersTypingRef.current.get(typing.name)

            if (anterior) {
                clearTimeout(anterior)
            }

            const timer = setTimeout(() => {
                timersTypingRef.current.delete(typing.name)
                setTypingNames(atual => atual.filter(nome => nome !== typing.name))
            }, VALIDADE_TYPING_MS)

            timersTypingRef.current.set(typing.name, timer)
        }

        socket.on("connect", aoConectar)
        socket.on("disconnect", aoDesconectar)
        socket.on("chat:message", aoReceber)
        socket.on("chat:joined", aoEntrarAlguem)
        socket.on("chat:left", aoSairAlguem)
        socket.on("chat:typing", aoReceberTyping)
        socket.on("chat:image", aoReceberImagem)
        socket.on("presence:list", aoReceberOnline)

        socketRef.current = socket

        return () => {
            socket.off("connect", aoConectar)
            socket.off("disconnect", aoDesconectar)
            socket.off("chat:message", aoReceber)
            socket.off("chat:joined", aoEntrarAlguem)
            socket.off("chat:left", aoSairAlguem)
            socket.off("chat:typing", aoReceberTyping)
            socket.off("chat:image", aoReceberImagem)
            socket.off("presence:list", aoReceberOnline)
            socket.disconnect()

            // Os timers sobreviveriam ao desmonte e tentariam atualizar um
            // componente que não existe mais.
            for (const timer of timersTypingRef.current.values()) {
                clearTimeout(timer)
            }

            timersTypingRef.current.clear()
        }
    }, [isJoined, name, room, limparTypingDe])

    // Efeito 2: depois de a tela atualizar com a mensagem nova, rola até o fim
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [feed])

    // O feed guarda tudo que chegou; a tela mostra só a sala atual. Filtrar na
    // exibição, e não na chegada, mantém o histórico se a pessoa voltar à sala.
    const feedDaSala = useMemo(() => feed.filter(item => {
        if (item.kind === "message") {
            return item.message.room === room
        }

        if (item.kind === "join") {
            return item.join.room === room
        }

        if (item.kind === "leave") {
            return item.leave.room === room
        }

        return item.image.room === room
    }), [feed, room])

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

    // Digitar: emite chat:typing no máximo uma vez a cada INTERVALO_TYPING_MS
    function aoDigitar(event: ChangeEvent<HTMLInputElement>) {
        setText(event.target.value)

        if (!isConnected) {
            return
        }

        const agora = Date.now()

        if (agora - ultimoTypingRef.current < INTERVALO_TYPING_MS) {
            return
        }

        ultimoTypingRef.current = agora
        socketRef.current?.emit("chat:typing", { name, room })
    }

    // Clique no emoji: o handler lê qual foi (data-emoji) e emite pelo túnel, igual ao envio do texto
    function aoClicarEmoji(event: MouseEvent<HTMLButtonElement>) {
        const emoji = event.currentTarget.dataset.emoji

        if (!emoji || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:message", { name, room, text: emoji })
    }

    // Trocar de sala: sai da antiga e entra na nova. O chat:leave vai primeiro,
    // senão a pessoa já estaria fora quando o aviso chegasse.
    function aoTrocarSala(event: MouseEvent<HTMLButtonElement>) {
        const destino = event.currentTarget.dataset.room as ChatRoom | undefined

        if (!destino || destino === room || !isConnected) {
            return
        }

        socketRef.current?.emit("chat:leave", { name, room })
        socketRef.current?.emit("chat:join", { name, room: destino })

        setTypingNames([])
        setImageError("")
        setRoom(destino)
    }

    // Sair: avisa a sala e volta para a tela do nome
    function aoSair() {
        socketRef.current?.emit("chat:leave", { name, room })

        setIsJoined(false)
        setIsConnected(false)
        setFeed([])
        setTypingNames([])
        setImageError("")
        setName("")
        setNameDraft("")
    }

    // Abrir o seletor de arquivo a partir do botão, em vez de deixar o input à mostra
    function aoClicarImagem() {
        fileRef.current?.click()
    }

    // Escolher a imagem: valida o tamanho, lê como dataURL e emite. O trabalho
    // pesado não acontece aqui nem no servidor websocket — vai para a fila.
    function aoEscolherImagem(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]

        event.target.value = ""

        if (!file || !isConnected) {
            return
        }

        if (file.size > LIMITE_IMAGEM_BYTES) {
            setImageError(`"${file.name}" tem ${Math.round(file.size / 1024)} KB. O limite é 500 KB.`)
            return
        }

        setImageError("")

        const reader = new FileReader()

        reader.onload = () => {
            const data = String(reader.result ?? "")

            if (!data) {
                return
            }

            socketRef.current?.emit("chat:image", { name, room, filename: file.name, data })
        }

        reader.onerror = () => setImageError(`Não consegui ler "${file.name}".`)

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
    const avisoDigitando = typingNames.length === 0 ? "" : frasesDigitando(typingNames)

    return (
        <>
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <strong># {room} · {name}</strong>

                <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${statusClass}`}>{statusLabel}</span>
                    <button className="btn btn-sm btn-outline-danger" type="button" onClick={aoSair}>
                        Sair da sala
                    </button>
                </div>
            </div>

            <div className="card-header d-flex gap-2 border-top-0">
                {CHAT_ROOMS.map(item => {
                    const isAtual = item === room
                    const classe = isAtual ? "btn-primary" : "btn-outline-primary"

                    return (
                        <button
                            key={item}
                            type="button"
                            className={`btn btn-sm ${classe}`}
                            data-room={item}
                            disabled={!isConnected}
                            onClick={aoTrocarSala}
                        >
                            # {item}
                        </button>
                    )
                })}
            </div>

            <div className="card-body" style={{ height: "55vh", overflowY: "auto" }}>
                {feedDaSala.length === 0 && <p className="text-muted">Nenhuma mensagem ainda. Escreva a primeira.</p>}

                {feedDaSala.map(item => {
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
                        const who = item.leave.name === name ? "Você" : item.leave.name

                        return (
                            <p key={`leave-${item.leave.sentAt}-${item.leave.name}`} className="text-center my-2">
                                {/* Saída em âmbar: a cor diferencia de "entrou" sem precisar ler o texto */}
                                <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis fw-normal px-3 py-2">
                                    ⬅ {who} saiu da sala · {formatTime(item.leave.sentAt)}
                                </span>
                            </p>
                        )
                    }

                    if (item.kind === "image") {
                        const image = item.image
                        const isMine = image.name === name
                        const alignImage = isMine ? "align-items-end" : "align-items-start"

                        return (
                            <div
                                key={`image-${image.sentAt}-${image.name}-${image.filename}`}
                                className={`d-flex flex-column ${alignImage} mb-2`}
                            >
                                <small className="text-muted">
                                    {isMine ? "você" : image.name} enviou uma imagem · {formatTime(image.sentAt)}
                                </small>
                                <img
                                    src={image.thumb}
                                    alt={image.filename}
                                    className="rounded-3 border"
                                    style={{ maxWidth: "240px", maxHeight: "240px" }}
                                />
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
                    disabled={!isConnected}
                    onClick={aoClicarImagem}
                >
                    📎 imagem
                </button>

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="d-none"
                    onChange={aoEscolherImagem}
                />
            </div>

            {imageError && <p className="card-footer border-top-0 pb-0 text-danger mb-0">{imageError}</p>}

            {/* Altura fixa: sem ela, o aviso aparecendo e sumindo empurra o campo de texto */}
            <p className="card-footer border-top-0 pb-0 mb-0 text-muted fst-italic" style={{ minHeight: "1.5rem" }}>
                {avisoDigitando}
            </p>

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
