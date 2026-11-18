import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client emite chat:typing enquanto digita.
 * O Event publica no exchange; cada servidor entrega para a sala.
 * O client faz throttle (máx. 1 emissão a cada ~1,5 s).
 */
export default createEvent({
    name: 'chat:typing',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim()
        const room = String(payload?.room ?? '').trim()

        if (!name || !room) {
            return
        }

        await context.notify('chat:typing', { name, room, sentAt: Date.now() })
    }
})
