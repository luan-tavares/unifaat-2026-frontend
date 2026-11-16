import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client sai da sala (chat:leave). O socket deixa a sala (socket.leave) e os outros
 * que estão nela são avisados (chat:left).
 */
export default createEvent({
    name: 'chat:leave',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim().slice(0, 30)
        const room = String(payload?.room ?? '').trim()

        if (!name || !room) {
            return
        }

        context.socket.leave(room)

        // "fulano saiu da sala": vai pelo exchange e é entregue só para quem está na sala
        await context.notify('chat:left', { name, room, sentAt: Date.now() })
    }
})
