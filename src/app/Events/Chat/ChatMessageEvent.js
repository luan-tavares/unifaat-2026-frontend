import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client emite chat:message pelo túnel WebSocket.
 * O Event NÃO entrega nada na tela: só publica no exchange (já com o room); cada servidor websocket
 * recebe a cópia na sua fila dinâmica e entrega SÓ para quem está na sala (io.to(room).emit).
 */
export default createEvent({
    name: 'chat:message',
    handle: async (payload, context) => {
        const text = String(payload?.text ?? '').trim()

        if (!text) {
            return
        }

        const name = String(payload?.name ?? '').trim() || 'anônimo'
        const room = String(payload?.room ?? '').trim()

        await context.notify('chat:message', { name, text: text.slice(0, 500), room, sentAt: Date.now() })
    }
})
