import { createEvent } from '../../../utils/event.js'
import { parseName, parseRoom } from './rooms.js'

/**
 * Chat: o client sai de uma sala (chat:leave { name, room }): ao trocar de sala ou no botão "Sair da sala".
 * O socket deixa a sala do Socket.IO (socket.leave) e quem ficou é avisado (chat:left) pelo exchange.
 */
export default createEvent({
    name: 'chat:leave',
    handle: async (payload, context) => {
        const name = parseName(payload?.name)
        const room = parseRoom(payload?.room)

        if (!name || !room) {
            return
        }

        context.socket.leave(room)

        if (context.socket.data.room === room) {
            context.socket.data.room = null
        }

        // "fulano saiu da sala": o autor já saiu da sala, então só quem ficou recebe
        await context.notify('chat:left', { name, room, sentAt: Date.now() })
    }
})
