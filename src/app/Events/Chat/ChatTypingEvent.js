import { createEvent } from '../../../utils/event.js'
import { normalizeRoom } from '../../../utils/chatRooms.js'

/**
 * Chat: "fulano está digitando…" (chat:typing).
 * Não guarda nada: só publica no exchange, e cada websocket entrega a cópia à sala (io.to(room)).
 * Não precisa ser registrado no _websocket.js: o loadEvents descobre este arquivo sozinho.
 */
export default createEvent({
    name: 'chat:typing',
    handle: async (payload, context) => {
        const name = String(context.socket.data.name ?? payload?.name ?? '').trim().slice(0, 30)

        if (!name) {
            return
        }

        const room = normalizeRoom(payload?.room ?? context.socket.data.room)

        await context.notify('chat:typing', { name, room })
    }
})
