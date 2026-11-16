import { createEvent } from '../../../utils/event.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'

// 500 KB de arquivo viram ~667 KB em base64 (4 caracteres a cada 3 bytes), mais o prefixo do dataURL
const MAX_DATA_LENGTH = Math.ceil((500 * 1024 * 4) / 3) + 100

/**
 * Chat: o client envia uma imagem (chat:image) como dataURL em base64.
 * O Event NÃO processa nada: só valida e lança um job na fila "images". Quem gera a miniatura é o worker,
 * que no fim avisa o resultado pelo exchange "results".
 */
export default createEvent({
    name: 'chat:image',
    handle: async (payload) => {
        const name = String(payload?.name ?? '').trim().slice(0, 30)
        const room = String(payload?.room ?? '').trim()
        const filename = String(payload?.filename ?? '').trim().slice(0, 100)
        const data = String(payload?.data ?? '')

        if (!name || !room || !filename) {
            return
        }

        if (!data.startsWith('data:image/') || data.length > MAX_DATA_LENGTH) {
            return
        }

        await ProcessChatImageJob.dispatch('images', { name, room, filename, data })
    }
})
