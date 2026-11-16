import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client avisa que está digitando (chat:typing).
 * Só repassa pelo exchange; quem filtra "não mostrar para mim mesmo" é o React.
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
