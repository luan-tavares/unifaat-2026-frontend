/**
 * Salas do chat. O nome da sala viaja no payload de todo evento de chat (room) e, no servidor,
 * vira uma sala do Socket.IO (socket.join / io.to).
 */
export const CHAT_ROOMS = ['geral', 'dev']

export const DEFAULT_CHAT_ROOM = 'geral'

/** Devolve a sala em minúsculas se ela existir; senão, null (nunca aceita uma sala inventada pelo client). */
export function parseRoom(room) {
    const value = String(room ?? '').trim().toLowerCase()

    return CHAT_ROOMS.includes(value) ? value : null
}

/** Igual ao parseRoom, mas cai na sala padrão quando a sala é inválida ou não veio. */
export function normalizeRoom(room) {
    return parseRoom(room) ?? DEFAULT_CHAT_ROOM
}
