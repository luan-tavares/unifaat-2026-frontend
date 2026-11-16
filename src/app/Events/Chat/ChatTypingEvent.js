import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client emite chat:typing enquanto está digitando.
 * O Event apenas notifica os outros participantes da sala (sem processar nada pesado).
 */
export default createEvent({
    name: 'chat:typing',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim()
        const room = String(payload?.room ?? '').trim()

        if (!name || !room) {
            return
        }

        await context.notify('chat:typing', { name, room })
    }
})
