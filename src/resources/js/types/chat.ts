// As salas do chat: cada uma mostra só as suas mensagens
export type ChatRoom = "geral" | "dev"

// A mensagem que viaja pelo túnel: o servidor websocket carimba a hora (sentAt) e a sala (room)
export type ChatMessage = {
    name: string
    text: string
    room: ChatRoom
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

// "fulano saiu da sala": o aviso de quem deu chat:leave (ao trocar de sala ou sair)
export type ChatLeave = {
    name: string
    room: ChatRoom
    sentAt: number
}

// "fulano está digitando…": só a notificação, sem hora (some sozinho no client)
export type ChatTyping = {
    name: string
    room: ChatRoom
}

// A imagem já processada pelo worker: a miniatura (dataURL) volta pelo exchange "results"
export type ChatImage = {
    name: string
    room: ChatRoom
    filename: string
    thumb: string
    sentAt: number
}

// A lista da sala mistura mensagens, avisos (entrou/saiu) e imagens.
// Cada item ganha um id estável do próprio client, usado como key da lista.
export type ChatFeedItem =
    | { kind: "message"; id: string; message: ChatMessage }
    | { kind: "join"; id: string; join: ChatJoin }
    | { kind: "leave"; id: string; leave: ChatLeave }
    | { kind: "image"; id: string; image: ChatImage }
