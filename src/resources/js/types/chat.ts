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

// "fulano entrou na sala"
export type ChatJoin = {
    name: string
    room: string
    sentAt: number
}

// "fulano saiu da sala"
export type ChatLeave = {
    name: string
    room: string
    sentAt: number
}

// "fulano está digitando"
export type ChatTyping = {
    name: string
    room: string
}

// Imagem processada pelo worker
export type ChatImage = {
    name: string
    room: string
    filename: string
    thumb: string
}

// Imagem sendo processada (aviso imediato)
export type ChatImageProcessing = {
    name: string
    room: string
    filename: string
}

// A lista da sala mistura mensagens, avisos de entrada/saída e imagens
export type ChatFeedItem =
    | { kind: "message"; message: ChatMessage }
    | { kind: "join"; join: ChatJoin }
    | { kind: "leave"; leave: ChatLeave }
    | { kind: "image"; image: ChatImage }
    | { kind: "image:processing"; processing: ChatImageProcessing }

export type Room = "geral" | "dev"
