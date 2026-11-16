import { createEvent } from '../../../utils/event.js'
import { normalizeRoom } from '../../../utils/chatRooms.js'

/**
 * Chat: o client sai de uma sala (chat:leave).
 * O socket deixa a sala e os outros recebem "fulano saiu da sala" (chat:left) pelo exchange.
 */
export default createEvent({
    name: 'chat:leave',
    handle: async (payload, context) => {
        const room = normalizeRoom(payload?.room)

        if (!room || !context.socket.rooms.has(room)) {
            return
        }

        const name = String(context.socket.data.name ?? payload?.name ?? '').trim().slice(0, 30)

        context.socket.leave(room)

        if (!name) {
            return
        }

        await context.notify('chat:left', { name, room, sentAt: Date.now() })
    }
})
