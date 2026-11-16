import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client entra na sala e diz o nome e a sala (chat:join), logo depois de o túnel abrir.
 * O nome fica no próprio socket (socket.data), o socket ENTRA na sala (socket.join), a presença é
 * publicada para as outras réplicas e a sala é avisada (chat:joined), já carregando o room no payload.
 */
export default createEvent({
    name: 'chat:join',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim().slice(0, 30)
        const room = String(payload?.room ?? '').trim()

        if (!name) {
            return
        }

        context.socket.data.name = name

        if (room) {
            context.socket.join(room)
        }

        await context.presence.publish()

        // "fulano entrou na sala": vai pelo exchange e o websocket entrega só para quem está na sala
        await context.notify('chat:joined', { name, room, sentAt: Date.now() })
    }
})
