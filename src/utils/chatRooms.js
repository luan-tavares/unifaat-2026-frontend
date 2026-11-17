/**
 * Salas do chat. Os Events validam a sala que veio do client: sala desconhecida não entra.
 */
export const CHAT_ROOMS = ['geral', 'dev']

export function chatRoomOf(value) {
    const room = String(value ?? '').trim()

    if (!CHAT_ROOMS.includes(room)) {
        return null
    }

    return room
}
