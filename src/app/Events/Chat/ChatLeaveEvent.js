import { createEvent } from '../../../utils/event.js'

/**
 * Chat: a pessoa sai da sala (trocando de sala ou voltando para a tela do nome).
 *
 * Tira o socket da sala ANTES de avisar. A ordem importa: o `notify` volta pelo
 * exchange e é entregue com `io.to(room)`, então quem já saiu não recebe o
 * próprio aviso de saída — que é o comportamento desejado.
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

        await context.presence.publish()

        await context.notify('chat:left', { name, room, sentAt: Date.now() })
    }
})
