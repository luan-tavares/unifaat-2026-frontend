import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client está digitando. Publica chat:typing no exchange para que todos os servidores
 * entreguem o aviso aos clients da mesma sala. Sem processamento: só repassa o nome e a sala.
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
