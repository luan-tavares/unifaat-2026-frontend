// As salas do chat (as mesmas que o backend aceita em app/Events/Chat/rooms.js)
export const ROOMS = ["geral", "dev"] as const

export type ChatRoom = (typeof ROOMS)[number]

// A mensagem que viaja pelo túnel: o servidor websocket carimba a hora (sentAt); todo evento de chat leva a sala
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

// "fulano saiu da sala": o aviso de quem deu chat:leave (mesmo formato do join)
export type ChatLeave = {
    name: string
    room: ChatRoom
    sentAt: number
}

// "fulano está digitando…": chega no máximo a cada ~1,5 s enquanto a pessoa digita
export type ChatTyping = {
    name: string
    room: ChatRoom
}

// A imagem processada pelo worker (miniatura em dataURL), devolvida pelo exchange "results"
export type ChatImage = {
    name: string
    room: ChatRoom
    filename: string
    thumb: string
    sentAt: number
}

// O que o client manda em chat:image: o arquivo lido pelo FileReader (dataURL em base64)
export type ChatImageUpload = {
    name: string
    room: ChatRoom
    filename: string
    data: string
}

// Respostas só para o autor: a imagem entrou na fila do worker, ou foi recusada pelo Event
export type ChatImageQueued = {
    room: ChatRoom
    filename: string
}

export type ChatImageError = {
    room: ChatRoom
    filename: string
    message: string
}

// A lista da sala mistura mensagens, avisos e imagens; o id é gerado no client quando o item chega (key estável)
export type ChatFeedItem =
    | { id: string; room: ChatRoom; kind: "message"; message: ChatMessage }
    | { id: string; room: ChatRoom; kind: "join"; join: ChatJoin }
    | { id: string; room: ChatRoom; kind: "leave"; leave: ChatLeave }
    | { id: string; room: ChatRoom; kind: "image"; image: ChatImage }
