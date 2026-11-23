import { createEvent } from '../../../utils/event.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'

/**
 * Chat: o client emite chat:image com { name, room, filename, data } (data = dataURL base64).
 * O Event NÃO processa nada: valida e lança o job ProcessChatImageJob na fila images.
 * O worker faz o trabalho pesado e avisa o resultado pelo exchange results.
 */
export default createEvent({
    name: 'chat:image',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim() || 'anônimo'
        const room = String(payload?.room ?? 'geral').trim()
        const filename = String(payload?.filename ?? 'imagem').trim()
        const data = String(payload?.data ?? '')

        if (!data.startsWith('data:image/')) {
            return
        }

        await ProcessChatImageJob.dispatch('images', { name, room, filename, data })

        // Avisa quem está na sala que o upload chegou e está sendo processado
        await context.notify('chat:image:processing', { name, room, filename })
    }
})
