// As salas do chat: cada evento de chat leva a sala no payload (room)
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

// "fulano está digitando…": só o nome e a sala, sem hora (o aviso some sozinho)
export type ChatTyping = {
    name: string
    room: ChatRoom
}

// O que o client manda em chat:image: o arquivo inteiro em base64 (dataURL)
export type ChatImageUpload = {
    name: string
    room: ChatRoom
    filename: string
    data: string
}

// O que volta do worker (exchange results) em chat:image: só a miniatura já processada
export type ChatImage = {
    name: string
    room: ChatRoom
    filename: string
    thumb: string
    sentAt: number
}

// O Event recusou a imagem (o client também valida, mas quem decide é o servidor)
export type ChatImageError = {
    room: ChatRoom
    filename: string
    reason: string
}

// A lista da sala mistura mensagens, imagens e avisos
export type ChatFeedItem =
    | { kind: "message"; message: ChatMessage }
    | { kind: "join"; join: ChatJoin }
    | { kind: "leave"; leave: ChatLeave }
    | { kind: "image"; image: ChatImage }
