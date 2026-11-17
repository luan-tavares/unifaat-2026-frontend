// As salas do chat: cada evento de chat leva a sala no payload
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

// "fulano saiu da sala": o aviso de quem deu chat:leave
export type ChatLeave = {
    name: string
    room: ChatRoom
    sentAt: number
}

// "fulano está digitando…": chega no máximo 1 vez a cada ~1,5 s por pessoa
export type ChatTyping = {
    name: string
    room: ChatRoom
}

// A imagem já processada pelo worker: thumb é a miniatura em dataURL
export type ChatImage = {
    name: string
    room: ChatRoom
    filename: string
    thumb: string
    sentAt: number
}

// O servidor recusou a imagem (inválida ou grande demais)
export type ChatImageError = {
    filename: string
    message: string
}

// A lista da sala mistura mensagens, imagens e avisos
export type ChatFeedItem =
    | { kind: "message"; message: ChatMessage }
    | { kind: "join"; join: ChatJoin }
    | { kind: "leave"; leave: ChatLeave }
    | { kind: "image"; image: ChatImage }
