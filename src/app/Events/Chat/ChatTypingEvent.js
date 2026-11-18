import { createEvent } from '../../../utils/event.js'
import { parseName, parseRoom } from '../../../utils/chatRooms.js'

/**
 * Chat: "fulano está digitando…". O client emite chat:typing { name, room } (com limite de frequência no React);
 * o Event só avisa a sala pelo exchange.
 */
export default createEvent({
    name: 'chat:typing',
    handle: async (payload, context) => {
        const name = parseName(payload?.name)
        const room = parseRoom(payload?.room)

        if (!name || !room) {
            return
        }

        await context.notify('chat:typing', { name, room })
    }
})
