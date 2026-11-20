import { createEvent } from '../../../utils/event.js'
import { normalizeRoom } from '../../../utils/chatRooms.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'

// 500 KB de imagem viram ~683 mil caracteres em base64 (4/3 do tamanho) + o prefixo "data:image/...;base64,"
const MAX_DATA_LENGTH = 700_000

const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/]+=*$/

/**
 * Chat: o client envia uma imagem (chat:image { name, room, filename, data }), com data em base64 (dataURL).
 * Este Event NÃO processa nada: só valida e lança um job na fila "images". Quem gera a miniatura é o worker,
 * que devolve o resultado pelo exchange "results" — o websocket só conecta e distribui.
 */
export default createEvent({
    name: 'chat:image',
    handle: async (payload, context) => {
        const name = String(context.socket.data.name ?? payload?.name ?? '').trim().slice(0, 30)
        const data = typeof payload?.data === 'string' ? payload.data : ''

        if (!name || !data || data.length > MAX_DATA_LENGTH || !IMAGE_DATA_URL.test(data)) {
            return
        }

        const room = normalizeRoom(payload?.room ?? context.socket.data.room)
        const filename = String(payload?.filename ?? 'imagem').trim().slice(0, 100) || 'imagem'

        // não processa nada: entrega a imagem a um worker e responde na hora
        await ProcessChatImageJob.dispatch('images', { name, room, filename, data })
    }
})
