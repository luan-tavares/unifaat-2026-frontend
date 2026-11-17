import { createEvent } from '../../../utils/event.js'
import { chatRoomOf } from '../../../utils/chatRooms.js'

/**
 * Chat: o client entra numa sala e diz o nome (chat:join { name, room }), logo depois de o túnel abrir.
 * O nome e a sala ficam no próprio socket (socket.data), o socket entra na sala do Socket.IO,
 * a presença é publicada para as outras réplicas e a sala é avisada (chat:joined).
 */
export default createEvent({
    name: 'chat:join',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim().slice(0, 30)
        const room = chatRoomOf(payload?.room)

        if (!name || !room) {
            return
        }

        context.socket.data.name = name
        context.socket.data.room = room
        context.socket.join(room)

        await context.presence.publish()

        // "fulano entrou na sala": vai pelo exchange, então chega a quem está na sala em qualquer réplica
        await context.notify('chat:joined', { name, room, sentAt: Date.now() })
    }
})
