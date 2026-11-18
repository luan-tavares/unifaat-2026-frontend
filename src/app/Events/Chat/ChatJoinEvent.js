import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client entra em uma sala (chat:join).
 * Aceita { name, room } para suporte a múltiplas salas.
 * O nome fica no socket.data, o socket entra na sala do Socket.IO e a presença é publicada.
 */
export default createEvent({
    name: 'chat:join',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim().slice(0, 30)
        const room = String(payload?.room ?? 'geral').trim() || 'geral'

        if (!name) {
            return
        }

        context.socket.data.name = name
        context.socket.data.room = room

        // Entra na sala do Socket.IO (para io.to(room).emit funcionar)
        context.socket.join(room)

        await context.presence.publish()

        // "fulano entrou na sala": vai pelo exchange, chega a quem está em qualquer réplica
        await context.notify('chat:joined', { name, room, sentAt: Date.now() })
    }
})
