import { createEvent } from '../../../utils/event.js'
import { parseName, parseRoom } from './rooms.js'

/**
 * Chat: "fulano está digitando…" (chat:typing { name, room }).
 * Event novo = arquivo novo: o loadEvents descobre sozinho, o _websocket.js não muda.
 * O client já limita o envio (no máximo 1 a cada ~1,5 s); aqui só repassa para a sala pelo exchange.
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
