// As duas salas do chat. O tipo literal é o que impede um `room: "geral "` com
// espaço, ou um nome inventado, chegar ao backend sem o compilador reclamar.
export type ChatRoom = "geral" | "dev"

export const CHAT_ROOMS: readonly ChatRoom[] = ["geral", "dev"] as const

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

// "fulano saiu da sala": o aviso de quem deu chat:leave, trocando de sala ou saindo
export type ChatLeave = {
    name: string
    room: ChatRoom
    sentAt: number
}

// "fulano está digitando…": chega a cada tecla (no máximo 1 a cada 1,5 s) e não
// entra no feed — vive num aviso próprio, acima do campo
export type ChatTyping = {
    name: string
    room: ChatRoom
    sentAt: number
}

// A imagem já processada pelo worker. O `thumb` é o dataURL da miniatura; ele
// só chega DEPOIS de o worker da fila `images` terminar, pelo exchange `results`
export type ChatImage = {
    name: string
    room: ChatRoom
    filename: string
    thumb: string
    sentAt: number
}

// A lista da sala mistura mensagens e avisos
export type ChatFeedItem =
    | { kind: "message"; message: ChatMessage }
    | { kind: "join"; join: ChatJoin }
    | { kind: "leave"; leave: ChatLeave }
    | { kind: "image"; image: ChatImage }
