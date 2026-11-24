import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client entra em uma sala e diz o nome (chat:join), logo depois de o túnel abrir.
 * O nome fica no próprio socket (socket.data), o socket é colocado na sala e a presença é publicada.
 */
export default createEvent({
    name: 'chat:join',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim().slice(0, 30)
        const room = String(payload?.room ?? '').trim() || 'geral'

        if (!name) {
            return
        }

        context.socket.data.name = name
        context.socket.join(room)

        await context.presence.publish()

        // "fulano entrou na sala": vai pelo exchange, então chega a quem está em qualquer réplica
        await context.notify('chat:joined', { name, room, sentAt: Date.now() })
    }
})
