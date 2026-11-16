// As duas salas do chat: o servidor entrega cada evento só a quem está na sala (room no payload)
export const ROOMS = ["geral", "dev"] as const

export type Room = typeof ROOMS[number]

// A mensagem que viaja pelo túnel: o servidor websocket carimba a hora (sentAt)
export type ChatMessage = {
    name: string
    room: Room
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
    room: Room
    sentAt: number
}

// "fulano saiu da sala": o aviso de quem deu chat:leave
export type ChatLeft = {
    name: string
    room: Room
    sentAt: number
}

// "fulano está digitando…": efêmero, nunca entra no feed
export type ChatTyping = {
    name: string
    room: Room
}

// A imagem já processada pelo worker: thumb é a miniatura em dataURL
export type ChatImage = {
    name: string
    room: Room
    filename: string
    thumb: string
    sentAt: number
}

// A lista da sala mistura mensagens, imagens e avisos
export type ChatFeedItem =
    | { kind: "message"; message: ChatMessage }
    | { kind: "join"; join: ChatJoin }
    | { kind: "left"; left: ChatLeft }
    | { kind: "image"; image: ChatImage }

// Cada sala tem o seu próprio feed
export type ChatFeed = Record<Room, ChatFeedItem[]>
