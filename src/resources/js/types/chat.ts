// A mensagem que viaja pelo túnel: o servidor websocket carimba a hora (sentAt)
export type ChatMessage = {
    name: string
    text: string
    room: string
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
    room: string
    sentAt: number
}

// "fulano saiu da sala": o aviso de quem acabou de dar chat:leave
export type ChatLeave = {
    name: string
    room: string
    sentAt: number
}

// "fulano está digitando...": o aviso de quem está digitando
export type ChatTyping = {
    name: string
    room: string
}

// Imagem enviada no chat
export type ChatImage = {
    name: string
    room: string
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

