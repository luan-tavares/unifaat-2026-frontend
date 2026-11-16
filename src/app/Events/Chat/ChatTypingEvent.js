import { createEvent } from '../../../utils/event.js'

/**
 * Chat: o client avisa "estou digitando" (chat:typing) enquanto escreve.
 * Igual aos outros Events, só publica no exchange; o websocket entrega a quem
 * está NA SALA (o payload leva o room), e o próprio client ignora o aviso de si mesmo.
 * O Event não processa nada: é só a notificação, bem leve.
 */
export default createEvent({
    name: 'chat:typing',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim()
        const room = String(payload?.room ?? '').trim()

        if (!name || !room) {
            return
        }

        await context.notify('chat:typing', { name, room })
    }
})
