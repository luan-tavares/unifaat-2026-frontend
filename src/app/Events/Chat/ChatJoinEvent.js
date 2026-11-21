import { createEvent } from '../../../utils/event.js'
import { normalizeName, normalizeRoom } from '../../../utils/chatRooms.js'

/**
 * Chat: o client entra numa sala e diz o nome (chat:join), logo depois de o túnel abrir ou ao trocar de sala.
 * O socket entra na sala do Socket.IO (socket.join), o nome e a sala ficam no próprio socket (socket.data),
 * a presença é publicada para as outras réplicas e a sala é avisada (chat:joined, com room no payload).
 */
export default createEvent({
    name: 'chat:join',
    handle: async (payload, context) => {
        const name = normalizeName(payload?.name)
        const room = normalizeRoom(payload?.room)

        if (!name || !room) {
            return
        }

        const previousRoom = context.socket.data.room

        if (previousRoom && previousRoom !== room) {
            context.socket.leave(previousRoom)
        }

        context.socket.join(room)
        context.socket.data.name = name
        context.socket.data.room = room

        await context.presence.publish()

        // "fulano entrou na sala": vai pelo exchange, e cada réplica entrega só a quem está nessa sala
        await context.notify('chat:joined', { name, room, sentAt: Date.now() })
    }
})
