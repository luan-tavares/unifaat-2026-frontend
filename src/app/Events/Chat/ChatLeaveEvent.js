import { createEvent } from '../../../utils/event.js'
import { parseName, parseRoom } from '../../../utils/chatRooms.js'

/**
 * Chat: o client sai de uma sala (chat:leave { name, room }).
 * O aviso (chat:left) é publicado ANTES de o socket sair, para a sala inteira (inclusive quem saiu) receber;
 * depois o socket deixa a sala do socket.io e não recebe mais nada dela.
 */
export default createEvent({
    name: 'chat:leave',
    handle: async (payload, context) => {
        const name = parseName(payload?.name) || context.socket.data.name
        const room = parseRoom(payload?.room)

        if (!name || !room) {
            return
        }

        await context.notify('chat:left', { name, room, sentAt: Date.now() })

        context.socket.leave(room)
    }
})
