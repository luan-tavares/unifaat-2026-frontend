import { createEvent } from '../../../utils/event.js'
import { chatRoomOf } from '../../../utils/chatRooms.js'

/**
 * Chat: o client sai da sala (chat:leave { name, room }), ao trocar de sala ou no botão "Sair da sala".
 * O socket sai da sala do Socket.IO e quem ficou é avisado (chat:left).
 */
export default createEvent({
    name: 'chat:leave',
    handle: async (payload, context) => {
        const room = chatRoomOf(payload?.room)
        const name = String(context.socket.data.name ?? payload?.name ?? '').trim().slice(0, 30)

        if (!name || !room) {
            return
        }

        context.socket.leave(room)

        if (context.socket.data.room === room) {
            context.socket.data.room = null
        }

        // Sai da sala ANTES de avisar: quem saiu não recebe o próprio "saiu da sala"
        await context.notify('chat:left', { name, room, sentAt: Date.now() })
    }
})
