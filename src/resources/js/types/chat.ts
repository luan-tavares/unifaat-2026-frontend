// As salas do chat: o nome viaja em `room` no payload de todo evento de chat
export type ChatRoom = "geral" | "dev"

// A mensagem que viaja pelo túnel: o servidor websocket carimba a hora (sentAt)
export type ChatMessage = {
    name: string
    room: ChatRoom
    text: string
    sentAt: number
}

// Quem está online: o servidor websocket junta a lista de todas as réplicas e manda em presence:list
export type OnlineUser = {
    id: string
    name: string
    ip: string
}

// "fulano entrou na sala": o aviso de quem acabou de dar chat:join
export type ChatJoin = {
    name: string
    room: ChatRoom
    sentAt: number
}

// "fulano saiu da sala": o aviso de quem deu chat:leave (chega como chat:left)
export type ChatLeave = {
    name: string
    room: ChatRoom
    sentAt: number
}

// "fulano está digitando…": chega como chat:typing (sem hora: vale só por alguns segundos)
export type ChatTyping = {
    name: string
    room: ChatRoom
}

// A imagem já processada pelo worker: thumb é a miniatura (dataURL) que volta pelo exchange results
export type ChatImage = {
    name: string
    room: ChatRoom
    filename: string
    thumb: string
    sentAt: number
}

// A lista da sala mistura mensagens, avisos e imagens
export type ChatFeedItem =
    | { kind: "message"; message: ChatMessage }
    | { kind: "join"; join: ChatJoin }
    | { kind: "leave"; leave: ChatLeave }
    | { kind: "image"; image: ChatImage }
