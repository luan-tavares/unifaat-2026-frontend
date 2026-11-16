import { createEvent } from '../../../utils/event.js'
import { normalizeRoom } from '../../../utils/chatRooms.js'

/**
 * Chat: o client emite chat:message pelo túnel WebSocket.
 * O Event NÃO entrega nada na tela: só publica no exchange; cada servidor websocket recebe a cópia
 * na sua fila dinâmica e faz o emit só para os clients da sala (inclusive o autor).
 */
export default createEvent({
    name: 'chat:message',
    handle: async (payload, context) => {
        const text = String(payload?.text ?? '').trim()
        const room = normalizeRoom(payload?.room)

        // Só quem está dentro da sala pode falar nela
        if (!text || !room || !context.socket.rooms.has(room)) {
            return
        }

        const name = String(payload?.name ?? '').trim() || 'anônimo'

        await context.notify('chat:message', { name, room, text: text.slice(0, 500), sentAt: Date.now() })
    }
})
