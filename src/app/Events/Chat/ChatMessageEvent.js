import { createEvent } from '../../../utils/event.js'
import { parseRoom } from './rooms.js'

/**
 * Chat: o client emite chat:message { name, room, text } pelo túnel WebSocket.
 * O Event NÃO entrega nada na tela: só publica no exchange; cada servidor websocket recebe a cópia
 * na sua fila dinâmica e entrega aos clients dele QUE ESTÃO NA SALA (inclusive o autor).
 */
export default createEvent({
    name: 'chat:message',
    handle: async (payload, context) => {
        const text = String(payload?.text ?? '').trim()
        const room = parseRoom(payload?.room)

        if (!text || !room) {
            return
        }

        const name = String(payload?.name ?? '').trim() || 'anônimo'

        await context.notify('chat:message', { name, room, text: text.slice(0, 500), sentAt: Date.now() })
    }
})
