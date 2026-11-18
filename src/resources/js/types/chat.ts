// As salas do chat
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
export type ChatLeft = {
    name: string
    room: ChatRoom
    sentAt: number
}

// "fulano está digitando…": sem hora, só vale enquanto novos avisos chegarem
export type ChatTyping = {
    name: string
    room: ChatRoom
}

// A imagem processada pelo worker: a miniatura volta pelo exchange results
export type ChatImage = {
    name: string
    room: ChatRoom
    filename: string
    thumb: string
}

// A lista da sala mistura mensagens, avisos e imagens
export type ChatFeedItem =
    | { kind: "message"; room: ChatRoom; message: ChatMessage }
    | { kind: "join"; room: ChatRoom; join: ChatJoin }
    | { kind: "left"; room: ChatRoom; left: ChatLeft }
    | { kind: "image"; room: ChatRoom; image: ChatImage; sentAt: number }
