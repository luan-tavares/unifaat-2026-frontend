import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client emite chat:leave ao trocar de sala ou sair.
 * Tira o socket da sala e avisa os outros com chat:left.
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
