import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client emite chat:leave ao sair da sala.
 * O Event tira o socket da sala e notifica os outros participantes.
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
