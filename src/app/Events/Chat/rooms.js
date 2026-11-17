/**
 * Salas do chat. Os Events validam a sala recebida do client por aqui: sala desconhecida não entra.
 * (Arquivo sem default export: o loadEvents ignora, porque não é um Event.)
 */
export const ROOMS = ['geral', 'dev']

export function parseRoom(value) {
    const room = String(value ?? '').trim()

    if (!ROOMS.includes(room)) {
        return null
    }

    return room
}

export function parseName(value) {
    return String(value ?? '').trim().slice(0, 30)
}
