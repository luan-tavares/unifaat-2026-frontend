import { createEvent } from '../../../utils/event.js'
import { normalizeRoom } from '../../../utils/chatRooms.js'

/**
 * Chat: o client avisa que está digitando (chat:typing).
 * O Event só valida e publica no exchange; cada servidor websocket entrega para quem está na sala.
 */
export default createEvent({
    name: 'chat:typing',
    handle: async (payload, context) => {
        const room = normalizeRoom(payload?.room)

        // Só quem está dentro da sala pode avisar que está digitando nela
        if (!room || !context.socket.rooms.has(room)) {
            return
        }

        const name = String(context.socket.data.name ?? payload?.name ?? '').trim().slice(0, 30)

        if (!name) {
            return
        }

        await context.notify('chat:typing', { name, room })
    }
})
