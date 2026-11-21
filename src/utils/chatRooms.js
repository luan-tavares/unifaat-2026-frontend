// As salas do chat: o client escolhe uma, o servidor só aceita estas
export const CHAT_ROOMS = ['geral', 'dev']

export function normalizeRoom(value) {
    const room = String(value ?? '').trim()

    if (!CHAT_ROOMS.includes(room)) {
        return null
    }

    return room
}

export function normalizeName(value) {
    return String(value ?? '').trim().slice(0, 30)
}
