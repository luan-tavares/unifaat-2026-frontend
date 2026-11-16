import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client sai de uma sala (chat:leave), ao trocar de sala ou ao voltar para a tela do nome.
 * O socket deixa a sala (socket.leave) e os que CONTINUAM na sala são avisados (chat:left).
 * Quem saiu já não está mais na sala, então não recebe o próprio aviso de saída.
 */
export default createEvent({
    name: 'chat:leave',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim().slice(0, 30)
        const room = String(payload?.room ?? '').trim()

        if (!name || !room) {
            return
        }

        context.socket.leave(room)

        // "fulano saiu da sala": vai pelo exchange e o websocket entrega só para quem ficou na sala
        await context.notify('chat:left', { name, room, sentAt: Date.now() })
    }
})
