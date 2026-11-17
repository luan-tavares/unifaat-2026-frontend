export type ChatRoom = "geral" | "dev"
export type ChatTyping = { userId: string; name: string; room: ChatRoom }
export type ChatNotice = ChatTyping & { id: string; sentAt: number }
export type ChatJoin = ChatNotice
export type ChatMessage = ChatNotice & { text: string }
export type ChatImage = ChatNotice & { filename: string; thumb: string }
export type OnlineUser = { id: string; name: string; ip: string }
export type ChatFeedItem =
    | { kind: "message"; payload: ChatMessage }
    | { kind: "join" | "leave"; payload: ChatNotice }
    | { kind: "image"; payload: ChatImage }
