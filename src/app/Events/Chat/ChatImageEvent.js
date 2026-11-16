import { createEvent } from '../../../utils/event.js'
import { normalizeRoom } from '../../../utils/chatRooms.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'

// 500 KB de imagem viram ~667 mil caracteres em base64; a folga cobre o prefixo "data:image/...;base64,"
const MAX_DATA_LENGTH = 700000

/**
 * Chat: o client envia uma imagem (chat:image).
 * O websocket só conecta e distribui: este Event NÃO processa nada. Valida e lança o Job na fila "images";
 * o worker gera a miniatura e devolve o resultado pelo exchange "results".
 */
export default createEvent({
    name: 'chat:image',
    handle: async (payload, context) => {
        const room = normalizeRoom(payload?.room)
        const data = String(payload?.data ?? '')

        if (!room || !context.socket.rooms.has(room)) {
            return
        }

        if (!data.startsWith('data:image/') || data.length > MAX_DATA_LENGTH) {
            return
        }

        const name = String(context.socket.data.name ?? payload?.name ?? '').trim().slice(0, 30)
        const filename = String(payload?.filename ?? 'imagem').trim().slice(0, 100)

        if (!name) {
            return
        }

        await ProcessChatImageJob.dispatch('images', { name, room, filename, data })
    }
})
