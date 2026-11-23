import { createEvent } from '../../../utils/event.js'
import { ipOf } from '../../../utils/presence.js'
import SaveMessageJob from '../../Jobs/SaveMessageJob.js'

/**
 * Chat: o client emite chat:message pelo túnel WebSocket.
 * O Event NÃO entrega nada na tela: só publica no exchange; cada servidor websocket recebe a cópia
 * na sua fila dinâmica e faz o io.emit para os clients dele (inclusive o autor).
 * Depois, dispara o job SaveMessageJob na fila save-message: quem grava no Postgres é um worker.
 */
export default createEvent({
    name: 'chat:message',
    handle: async (payload, context) => {
        const text = String(payload?.text ?? '').trim()

        if (!text) {
            return
        }

        const name = String(payload?.name ?? '').trim() || 'anônimo'
        const room = String(payload?.room ?? 'geral').trim()
        const message = text.slice(0, 500)
        const sentAt = Date.now()

        await context.notify('chat:message', { name, room, text: message, sentAt })

        // Gravar no banco não é trabalho do websocket: entrega o job à fila save-message e segue
        await SaveMessageJob.dispatch('save-message', { ip: ipOf(context.socket), name, message, sentAt })
    }
})
