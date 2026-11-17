import { createEvent } from '../../../utils/event.js'
import { chatRoomOf } from '../../../utils/chatRooms.js'

/**
 * Chat: o client avisa que está digitando (chat:typing), no máximo 1 vez a cada ~1,5 s.
 * O Event não guarda nada: só publica no exchange, e cada servidor websocket entrega para a sala.
 */
export default createEvent({
    name: 'chat:typing',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim().slice(0, 30)
        const room = chatRoomOf(payload?.room)

        if (!name || !room) {
            return
        }

        await context.notify('chat:typing', { name, room })
    }
})
