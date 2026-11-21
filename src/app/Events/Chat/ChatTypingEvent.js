import { createEvent } from '../../../utils/event.js'
import { normalizeName, normalizeRoom } from '../../../utils/chatRooms.js'

/**
 * Chat: "fulano está digitando…" (chat:typing).
 * Não guarda nada: só repassa pelo exchange; cada réplica entrega a quem está na sala
 * e o React de cada um ignora o aviso que for dele mesmo.
 */
export default createEvent({
    name: 'chat:typing',
    handle: async (payload, context) => {
        const name = normalizeName(payload?.name)
        const room = normalizeRoom(payload?.room)

        if (!name || !room) {
            return
        }

        await context.notify('chat:typing', { name, room })
    }
})
