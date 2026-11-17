import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent, MouseEvent } from "react"
import { io } from "socket.io-client"
import type { Socket } from "socket.io-client"
import type { ChatFeedItem, ChatImage, ChatJoin, ChatMessage, ChatNotice, ChatRoom, ChatTyping, OnlineUser } from "../types/chat"

const ROOMS: ChatRoom[] = ["geral", "dev"]
const EMOJIS = ["🔥", "💣", "😉", "💧", "🎉"]
const MAX_BYTES = 500 * 1024
const formatTime = (time: number) => new Date(time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

export function ChatApp() {
    const [nameDraft, setNameDraft] = useState("")
    const [name, setName] = useState("")
    const [room, setRoom] = useState<ChatRoom>("geral")
    const [isJoined, setIsJoined] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [feed, setFeed] = useState<ChatFeedItem[]>([])
    const [typing, setTyping] = useState<ChatTyping[]>([])
    const [online, setOnline] = useState<OnlineUser[]>([])
    const [text, setText] = useState("")
    const [error, setError] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [myId, setMyId] = useState("")
    const socketRef = useRef<Socket | null>(null)
    const roomRef = useRef<ChatRoom>("geral")
    const lastTyping = useRef(0)
    const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
    const readerRef = useRef<FileReader | null>(null)
    const endRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isJoined) return
        const socket = io({ transports: ["websocket"] })
        socketRef.current = socket
        const activeTimers = timers.current
        const clearTyping = (user: ChatTyping) => {
            const key = `${user.room}:${user.userId}`
            const timer = activeTimers.get(key)
            if (timer !== undefined) clearTimeout(timer)
            activeTimers.delete(key)
            setTyping(current => current.filter(item => item.room !== user.room || item.userId !== user.userId))
        }
        const clearAll = () => {
            activeTimers.forEach(timer => clearTimeout(timer))
            activeTimers.clear()
            setTyping([])
        }
        const append = (item: ChatFeedItem) => setFeed(current => current.some(existing => existing.payload.id === item.payload.id) ? current : [...current, item])
        const onConnect = () => {
            setMyId(socket.id ?? "")
            setIsConnected(true)
            socket.emit("chat:join", { name, room: roomRef.current })
        }
        const onDisconnect = () => { setIsConnected(false); clearAll() }
        const onMessage = (payload: ChatMessage) => { clearTyping(payload); append({ kind: "message", payload }) }
        const onJoin = (payload: ChatJoin) => append({ kind: "join", payload })
        const onLeave = (payload: ChatNotice) => { clearTyping(payload); append({ kind: "leave", payload }) }
        const onImage = (payload: ChatImage) => { clearTyping(payload); append({ kind: "image", payload }) }
        const onTyping = (payload: ChatTyping) => {
            if (payload.userId === socket.id || payload.room !== roomRef.current) return
            clearTyping(payload)
            setTyping(current => [...current, payload])
            const key = `${payload.room}:${payload.userId}`
            activeTimers.set(key, setTimeout(() => clearTyping(payload), 3000))
        }
        const onPresence = (users: OnlineUser[]) => setOnline(users)
        socket.on("connect", onConnect)
        socket.on("disconnect", onDisconnect)
        socket.on("chat:message", onMessage)
        socket.on("chat:joined", onJoin)
        socket.on("chat:left", onLeave)
        socket.on("chat:image", onImage)
        socket.on("chat:typing", onTyping)
        socket.on("presence:list", onPresence)
        return () => {
            socket.off("connect", onConnect)
            socket.off("disconnect", onDisconnect)
            socket.off("chat:message", onMessage)
            socket.off("chat:joined", onJoin)
            socket.off("chat:left", onLeave)
            socket.off("chat:image", onImage)
            socket.off("chat:typing", onTyping)
            socket.off("presence:list", onPresence)
            activeTimers.forEach(timer => clearTimeout(timer))
            activeTimers.clear()
            readerRef.current?.abort()
            readerRef.current = null
            socket.disconnect()
            socketRef.current = null
        }
    }, [isJoined, name])
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
        return () => { /* sem recursos persistentes neste efeito */ }
    }, [feed, room])

    function handleName(event: ChangeEvent<HTMLInputElement>) { setNameDraft(event.target.value) }
    function handleJoin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmed = nameDraft.trim()
        if (!trimmed) return
        roomRef.current = "geral"
        setRoom("geral")
        setFeed([])
        setTyping([])
        setOnline([])
        setError("")
        setName(trimmed)
        setIsJoined(true)
    }
    function handleRoom(event: MouseEvent<HTMLButtonElement>) {
        const next = event.currentTarget.dataset.room
        if (next !== "geral" && next !== "dev") return
        if (next === roomRef.current || !socketRef.current?.connected) return
        const old = roomRef.current
        socketRef.current.emit("chat:leave", { name, room: old })
        roomRef.current = next
        setRoom(next)
        setText("")
        setError("")
        lastTyping.current = 0
        timers.current.forEach(timer => clearTimeout(timer))
        timers.current.clear()
        setTyping([])
        socketRef.current.emit("chat:join", { name, room: next })
    }
    function resetSession() {
        setIsJoined(false)
        setIsConnected(false)
        setIsSending(false)
        setTyping([])
        setText("")
        setError("")
        lastTyping.current = 0
    }
    function handleLeave() {
        if (!socketRef.current?.connected) { resetSession(); return }
        socketRef.current.timeout(2000).emit("chat:leave", { name, room: roomRef.current }, resetSession)
    }
    function handleText(event: ChangeEvent<HTMLInputElement>) {
        const value = event.target.value
        setText(value)
        if (!value.trim() || !socketRef.current?.connected) return
        const now = Date.now()
        if (now - lastTyping.current < 1500) return
        lastTyping.current = now
        socketRef.current.emit("chat:typing", { name, room: roomRef.current })
    }
    function sendMessage(value: string) {
        const trimmed = value.trim()
        if (!trimmed || !socketRef.current?.connected) return
        socketRef.current.emit("chat:message", { name, room: roomRef.current, text: trimmed })
        setText("")
    }
    function handleSend(event: FormEvent<HTMLFormElement>) { event.preventDefault(); sendMessage(text) }
    function handleEmoji(event: MouseEvent<HTMLButtonElement>) { sendMessage(event.currentTarget.dataset.emoji ?? "") }
    function handleImage(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]
        event.target.value = ""
        setError("")
        if (!file || !socketRef.current?.connected) return
        if (file.size > MAX_BYTES) { setError("A imagem deve ter no máximo 500 KB."); return }
        if (!/^image\/(png|jpeg|gif|webp|bmp|avif|x-icon|vnd\.microsoft\.icon)$/i.test(file.type)) { setError("Formato de imagem não suportado."); return }
        const destination = roomRef.current
        const socket = socketRef.current
        const reader = new FileReader()
        readerRef.current = reader
        setIsSending(true)
        reader.onload = () => {
            if (typeof reader.result === "string" && socket.connected && roomRef.current === destination) {
                socket.emit("chat:image", { name, room: destination, filename: file.name, data: reader.result })
            }
            readerRef.current = null
            setIsSending(false)
        }
        reader.onerror = () => { setError("Não foi possível ler a imagem."); setIsSending(false); readerRef.current = null }
        reader.onabort = () => { setIsSending(false); readerRef.current = null }
        reader.readAsDataURL(file)
    }
    if (!isJoined) return (
        <form className="card" onSubmit={handleJoin}>
            <div className="card-body d-flex flex-column gap-3">
                <label htmlFor="chat-name">Seu nome</label>
                <input id="chat-name" className="form-control" value={nameDraft} onChange={handleName} maxLength={30} autoFocus />
                <button type="submit" className="btn btn-primary">Entrar na sala</button>
            </div>
        </form>
    )
    const visible = feed.filter(item => item.payload.room === room)
    const names = [...new Set(typing.filter(item => item.room === room).map(item => item.name))]
    const typingLabel = names.length === 1 ? `${names[0]} está digitando…` : `${names.join(" e ")} estão digitando…`
    return (
        <>
            <div className="card">
                <div className="card-header d-flex flex-wrap gap-2 align-items-center justify-content-between">
                    <strong>Sala {room} · {name}</strong>
                    <span className={`badge ${isConnected ? "text-bg-success" : "text-bg-secondary"}`}>{isConnected ? "conectado" : "conectando..."}</span>
                    <button className="btn btn-outline-danger btn-sm" onClick={handleLeave}>Sair da sala</button>
                </div>
                <div className="card-header d-flex gap-2">
                    {ROOMS.map(item => <button key={item} type="button" data-room={item} disabled={!isConnected} className={`btn ${room === item ? "btn-primary" : "btn-outline-primary"}`} onClick={handleRoom}># {item}</button>)}
                </div>
                <div className="card-body" style={{height:"55vh",overflowY:"auto"}}>
                    {visible.length === 0 && <p className="text-muted">Nenhuma mensagem ainda.</p>}
                    {visible.map(item => {
                        const payload = item.payload
                        const isMine = payload.userId === myId
                        const who = isMine ? "Você" : payload.name
                        if (item.kind === "join" || item.kind === "leave") return <p key={payload.id} className="text-center my-2"><span className={`badge rounded-pill ${item.kind === "join" ? "bg-success-subtle text-success-emphasis" : "bg-warning-subtle text-warning-emphasis"}`}>{who} {item.kind === "join" ? "entrou na sala" : "saiu da sala"} · {formatTime(payload.sentAt)}</span></p>
                        if (item.kind === "image") return <div key={payload.id} className="mb-2"><small>{who} enviou uma imagem · {formatTime(payload.sentAt)}</small><div><img src={item.payload.thumb} alt={item.payload.filename} style={{maxWidth:"min(100%, 260px)",maxHeight:260,objectFit:"contain"}} /></div></div>
                        if (item.kind === "message") return <div key={payload.id} className={`d-flex flex-column mb-2 ${isMine ? "align-items-end" : "align-items-start"}`}><small className="text-muted">{who} · {formatTime(payload.sentAt)}</small><span className={`rounded-3 px-3 py-2 ${isMine ? "bg-primary text-white" : "bg-light"}`}>{item.payload.text}</span></div>
                        return null
                    })}
                    <div ref={endRef}/>
                </div>
                <div className="card-footer d-flex gap-2 flex-wrap">
                    {EMOJIS.map(emoji => <button key={emoji} type="button" data-emoji={emoji} onClick={handleEmoji} disabled={!isConnected} className="btn btn-outline-secondary">{emoji}</button>)}
                    <label className="btn btn-outline-secondary mb-0" htmlFor="chat-image">📎 imagem</label>
                    <input id="chat-image" className="visually-hidden" type="file" accept="image/*" disabled={!isConnected || isSending} onChange={handleImage}/>
                </div>
                {names.length > 0 && <div className="px-3 pt-2 text-muted" aria-live="polite">{typingLabel}</div>}
                {error && <div role="alert" className="alert alert-warning m-2">{error}</div>}
                <form className="card-footer d-flex gap-2" onSubmit={handleSend}>
                    <input className="form-control" value={text} onChange={handleText} maxLength={500} placeholder="Digite uma mensagem..." />
                    <button type="submit" className="btn btn-primary" disabled={!isConnected}>Enviar</button>
                </form>
            </div>
            <div className="card mt-3"><div className="card-header"><strong>Online agora ({online.length})</strong></div><ul className="list-group list-group-flush">{online.map(user => <li key={user.id} className="list-group-item d-flex justify-content-between"><span>🟢 {user.name}{user.id === myId ? " (você)" : ""}</span><code>{user.ip}</code></li>)}</ul></div>
        </>
    )
}
