/** Salas do chat e validação dos campos que todo evento de chat carrega (name e room). */
export const CHAT_ROOMS = ['geral', 'dev']

export function parseRoom(value) {
    const room = String(value ?? '').trim()

    return CHAT_ROOMS.includes(room) ? room : null
}

export function parseName(value) {
    return String(value ?? '').trim().slice(0, 30)
}
