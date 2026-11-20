import { createEvent } from '../../../utils/event.js'
import { parseRoom } from '../../../utils/chatRooms.js'

/**
 * Chat: o client sai de uma sala (chat:leave), ao trocar de sala ou ao clicar em "Sair da sala".
 * O socket deixa a sala ANTES de o aviso ser publicado: quem saiu não recebe o próprio "saiu da sala",
 * e a sala (io.to(room), em cada réplica) é avisada com chat:left.
 */
export default createEvent({
    name: 'chat:leave',
    handle: async (payload, context) => {
        const name = String(context.socket.data.name ?? payload?.name ?? '').trim().slice(0, 30)
        const room = parseRoom(payload?.room)

        if (!name || !room) {
            return
        }

        await context.socket.leave(room)

        await context.notify('chat:left', { name, room, sentAt: Date.now() })
    }
})
