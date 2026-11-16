import { createEvent } from '../../../utils/event.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'

/**
 * Chat: o client envia uma imagem (chat:image) com o dataURL em base64.
 * REGRA DA AULA: o websocket só conecta e distribui; o trabalho pesado (gerar a miniatura)
 * NÃO roda aqui. O Event só valida e lança um job na fila "images" — um worker separado processa
 * e devolve o resultado por outro exchange ("results"). Nada de io nem de rabbit direto aqui:
 * o dispatch do job cuida da fila.
 */
export default createEvent({
    name: 'chat:image',
    handle: async (payload) => {
        const name = String(payload?.name ?? '').trim() || 'anônimo'
        const room = String(payload?.room ?? '').trim()
        const filename = String(payload?.filename ?? '').trim().slice(0, 120)
        const data = String(payload?.data ?? '')

        if (!room || !filename || !data) {
            return
        }

        await ProcessChatImageJob.dispatch('images', { name, room, filename, data })
    }
})
