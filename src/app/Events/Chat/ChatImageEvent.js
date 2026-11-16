import { createEvent } from '../../../utils/event.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'

/**
 * Chat: o client emite chat:image com uma imagem em base64.
 * O Event NÃO processa a imagem: só valida e lança um job na fila images.
 * O worker processará a imagem e publicará o resultado no exchange results.
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

        // Validação básica: verifica se é um dataURL válido
        if (!data.startsWith('data:image/')) {
            return
        }

        await ProcessChatImageJob.dispatch('images', { name, room, filename, data })
    }
})
