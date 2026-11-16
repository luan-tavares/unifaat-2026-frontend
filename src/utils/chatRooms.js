/** As salas do chat. Qualquer outro valor vindo do client é rejeitado. */
export const CHAT_ROOMS = ['geral', 'dev']

/** Devolve a sala válida (minúscula, sem espaços) ou null quando não existe. */
export function normalizeRoom(value) {
    const room = String(value ?? '').trim().toLowerCase()

    if (!CHAT_ROOMS.includes(room)) {
        return null
    }

    return room
}
