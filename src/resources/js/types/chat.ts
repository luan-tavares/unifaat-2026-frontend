// As duas salas do chat
export type ChatRoom = "geral" | "dev"

// A mensagem que viaja pelo túnel: o servidor websocket carimba a hora (sentAt) e leva a sala
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

// "fulano saiu da sala": o aviso de quem acabou de dar chat:leave (chat:left)
export type ChatLeave = {
    name: string
    room: ChatRoom
    sentAt: number
}

// "fulano está digitando": chat:typing
export type ChatTyping = {
    name: string
    room: ChatRoom
}

// Resultado do worker de imagens (chat:image): a miniatura volta pelo exchange "results"
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
