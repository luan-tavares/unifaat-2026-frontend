import { createEvent } from '../../../utils/event.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'

// 500 KB no dataURL. O limite também existe no React, mas repetir aqui é o que
// impede alguém de mandar 50 MB por fora da tela e travar o servidor.
const LIMITE_BYTES = 500 * 1024

/**
 * Chat: alguém mandou uma imagem.
 *
 * Este Event NÃO processa nada — é a regra da aula. Ele valida e joga o
 * trabalho na fila `images`. Gerar miniatura dentro do websocket seguraria o
 * event loop do processo que mantém TODAS as conexões abertas: uma imagem
 * pesada e o chat inteiro engasga.
 *
 * O resultado não volta por aqui. O worker publica no exchange `results`, que o
 * _websocket.js também assina, e aí sim a miniatura chega à sala.
 */
export default createEvent({
    name: 'chat:image',
    handle: async (payload) => {
        const name = String(payload?.name ?? '').trim().slice(0, 30)
        const room = String(payload?.room ?? '').trim()
        const filename = String(payload?.filename ?? '').trim().slice(0, 120)
        const data = String(payload?.data ?? '')

        if (!name || !room || !filename || !data) {
            return
        }

        if (!data.startsWith('data:image/')) {
            return
        }

        if (data.length > LIMITE_BYTES) {
            return
        }

        await ProcessChatImageJob.dispatch('images', { name, room, filename, data })
    }
})
