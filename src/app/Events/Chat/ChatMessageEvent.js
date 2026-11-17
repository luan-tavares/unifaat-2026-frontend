import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client emite chat:message pelo túnel WebSocket.
 * O Event NÃO entrega nada na tela: só publica no exchange; cada servidor websocket recebe a cópia
 * na sua fila dinâmica e faz o io.emit para os clients dele (inclusive o autor).
 */
export default createEvent({
    name: 'chat:message',
    handle: async (payload, context) => {
        const text = String(payload?.text ?? '').trim()

        if (!text) {
            return
        }

        const name = String(payload?.name ?? '').trim() || 'anônimo'

        // Sem a sala, o consumidor do exchange cai no io.emit e a mensagem de
        // #geral aparece em #dev.
        const room = String(payload?.room ?? '').trim()

        if (!room) {
            return
        }

        await context.notify('chat:message', { name, room, text: text.slice(0, 500), sentAt: Date.now() })
    }
})
