import { createEvent } from '../../../utils/event.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'

/**
 * Chat: o client quer enviar uma imagem. O Event NÃO processa nada: só valida e despacha
 * um job na fila images. O worker processa a miniatura e publica o resultado no exchange results.
 */
export default createEvent({
    name: 'chat:image',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim()
        const room = String(payload?.room ?? '').trim()
        const filename = String(payload?.filename ?? '').trim()
        const data = String(payload?.data ?? '').trim()

        if (!name || !room || !filename || !data) {
            return
        }

        await ProcessChatImageJob.dispatch('images', { name, room, filename, data })
    }
})
