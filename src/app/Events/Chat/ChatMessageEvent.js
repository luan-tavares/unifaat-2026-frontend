import { createEvent } from '../../../utils/event.js'
import { normalizeName, normalizeRoom } from '../../../utils/chatRooms.js'

/**
 * Chat: o client emite chat:message pelo túnel WebSocket.
 * O Event NÃO entrega nada na tela: só publica no exchange; cada servidor websocket recebe a cópia
 * na sua fila dinâmica e entrega a quem está na sala (inclusive o autor), por causa do room no payload.
 */
export default createEvent({
    name: 'chat:message',
    handle: async (payload, context) => {
        const text = String(payload?.text ?? '').trim()
        const room = normalizeRoom(payload?.room)

        if (!text || !room) {
            return
        }

        const name = normalizeName(payload?.name) || 'anônimo'

        await context.notify('chat:message', { name, room, text: text.slice(0, 500), sentAt: Date.now() })
    }
})
