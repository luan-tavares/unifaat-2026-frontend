// A mensagem que viaja pelo túnel: o servidor websocket carimba a hora (sentAt)
export type ChatMessage = {
    name: string
    text: string
    room: string
    sentAt: number
}

// Quem está online
export type OnlineUser = {
    id: string
    name: string
    ip: string
}

// "fulano entrou na sala"
export type ChatJoin = {
    name: string
    room: string
    sentAt: number
}

// "fulano saiu da sala"
export type ChatLeft = {
    name: string
    room: string
    sentAt: number
}

// "fulano está digitando"
export type ChatTyping = {
    name: string
    room: string
    sentAt: number
}

// Imagem processada pelo worker
export type ChatImage = {
    name: string
    room: string
    filename: string
    thumb: string
}

// A lista da sala mistura mensagens, avisos e imagens
export type ChatFeedItem =
    | { kind: "message"; message: ChatMessage }
    | { kind: "join"; join: ChatJoin }
    | { kind: "left"; left: ChatLeft }
    | { kind: "image"; image: ChatImage }
