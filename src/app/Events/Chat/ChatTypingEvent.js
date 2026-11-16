import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client avisa que está digitando (chat:typing). O Event só publica no exchange:
 * quem está na mesma sala vê "fulano está digitando…".
 */
export default createEvent({
    name: 'chat:typing',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim().slice(0, 30)
        const room = String(payload?.room ?? '').trim()

        if (!name || !room) {
            return
        }

        await context.notify('chat:typing', { name, room })
    }
})
