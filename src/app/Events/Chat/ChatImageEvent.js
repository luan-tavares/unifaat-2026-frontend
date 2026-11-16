import { createEvent } from '../../../utils/event.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'

// ~500 KB de arquivo viram ~700 KB em base64; o servidor não confia no limite do client
const MAX_DATA_LENGTH = 700_000
const IMAGE_DATA_URL = /^data:image\/(png|jpeg|gif|webp);base64,/

/**
 * Chat: o client envia uma imagem (chat:image).
 * O Event NÃO processa nada: valida e entrega o trabalho pesado a um worker (fila images).
 */
export default createEvent({
    name: 'chat:image',
    handle: async (payload, context) => {
        const name = String(payload?.name ?? '').trim().slice(0, 30)
        const room = String(payload?.room ?? '').trim()
        const filename = String(payload?.filename ?? '').slice(0, 100)
        const data = String(payload?.data ?? '')

        if (!name || !room || !IMAGE_DATA_URL.test(data) || data.length > MAX_DATA_LENGTH) {
            return
        }

        await ProcessChatImageJob.dispatch('images', { name, room, filename, data })
    }
})
