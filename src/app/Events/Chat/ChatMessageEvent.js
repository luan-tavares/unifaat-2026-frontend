import { createEvent } from '../../../utils/event.js'
import { normalizeRoom } from '../../../utils/chatRooms.js'

/**
 * Chat: o client emite chat:message pelo túnel WebSocket.
 * O Event NÃO entrega nada na tela: só publica no exchange; cada servidor websocket recebe a cópia
 * na sua fila dinâmica e entrega aos clients dele que estão na sala (io.to(room), inclusive o autor).
 */
export default createEvent({
    name: 'chat:message',
    handle: async (payload, context) => {
        const text = String(payload?.text ?? '').trim()

        if (!text) {
            return
        }

        const name = String(payload?.name ?? '').trim() || 'anônimo'
        const room = normalizeRoom(payload?.room ?? context.socket.data.room)

        await context.notify('chat:message', { name, room, text: text.slice(0, 500), sentAt: Date.now() })
    }
})
