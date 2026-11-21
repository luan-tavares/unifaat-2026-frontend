import { createEvent } from '../../../utils/event.js'
import { normalizeName, normalizeRoom } from '../../../utils/chatRooms.js'

/**
 * Chat: o client sai da sala (chat:leave), ao trocar de sala ou no botão "Sair da sala".
 * O socket deixa a sala do Socket.IO (socket.leave) e quem ficou é avisado (chat:left, com room no payload).
 */
export default createEvent({
    name: 'chat:leave',
    handle: async (payload, context) => {
        const name = normalizeName(payload?.name) || context.socket.data.name
        const room = normalizeRoom(payload?.room)

        if (!name || !room) {
            return
        }

        context.socket.leave(room)

        if (context.socket.data.room === room) {
            context.socket.data.room = null
        }

        await context.notify('chat:left', { name, room, sentAt: Date.now() })
    }
})
