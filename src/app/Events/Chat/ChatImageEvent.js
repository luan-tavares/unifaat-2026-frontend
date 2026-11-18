import { createEvent } from '../../../utils/event.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'

/**
 * Chat: o client emite chat:image com { name, room, filename, data }.
 * O Event NÃO processa nada: só valida e despacha para o worker via fila.
 * O websocket continua livre para os outros clients.
 */
export default createEvent({
    name: 'chat:image',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim()
        const room = String(payload?.room ?? '').trim()
        const filename = String(payload?.filename ?? '').trim()
        const data = payload?.data

        if (!name || !room || !filename || !data) {
            return
        }

        // Despacha para o worker: o Event não bloqueia o websocket
        await ProcessChatImageJob.dispatch('images', { name, room, filename, data })

        // Avisa o autor que a imagem está sendo processada
        context.socket.emit('chat:image:queued', { room })
    }
})
