import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client emite chat:typing enquanto digita.
 * Só repassa para o exchange; os outros clientes na sala exibem o aviso "fulano está digitando…".
 * Nunca processa nada pesado aqui.
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
