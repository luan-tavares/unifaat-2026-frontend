import { createEvent } from '../../../utils/event.js'
import { parseName, parseRoom } from '../../../utils/chatRooms.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'

// 500 KB de arquivo viram ~667 mil caracteres em base64; a folga cobre o prefixo do data URL
const MAX_DATA_LENGTH = 700_000

/**
 * Chat: o client emite chat:image { name, room, filename, data } (data = data URL em base64).
 * O Event NÃO processa nada: só valida e lança o job na fila "images". O worker gera a miniatura
 * e devolve o resultado pelo exchange "results" — o websocket só conecta e distribui.
 */
export default createEvent({
    name: 'chat:image',
    handle: async (payload) => {
        const name = parseName(payload?.name)
        const room = parseRoom(payload?.room)
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
