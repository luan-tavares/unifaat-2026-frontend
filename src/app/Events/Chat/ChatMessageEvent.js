import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client emite chat:message pelo túnel WebSocket.
 * O Event NÃO entrega nada na tela: só publica no exchange; cada servidor websocket recebe a cópia
 * na sua fila dinâmica e entrega via io.to(room).emit para os clients da sala.
 */
export default createEvent({
    name: 'chat:message',
    handle: async (payload, context) => {
        const text = String(payload?.text ?? '').trim()
        const room = String(payload?.room ?? 'geral').trim() || 'geral'

        if (!text) {
            return
        }

        const name = String(payload?.name ?? '').trim() || 'anônimo'

        await context.notify('chat:message', { name, room, text: text.slice(0, 500), sentAt: Date.now() })
    }
})
