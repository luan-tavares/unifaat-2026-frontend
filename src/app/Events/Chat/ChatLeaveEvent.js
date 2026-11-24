import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client sai de uma sala. Tira o socket da sala do Socket.IO e avisa os outros
 * via exchange (chat:left), para que todos os servidores entreguem o aviso.
 */
export default createEvent({
    name: 'chat:leave',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim()
        const room = String(payload?.room ?? '').trim()

        if (!name || !room) {
            return
        }

        context.socket.leave(room)

        await context.notify('chat:left', { name, room, sentAt: Date.now() })
    }
})
