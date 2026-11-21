import { createEvent } from '../../../utils/event.js'
import { normalizeName, normalizeRoom } from '../../../utils/chatRooms.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'

// 500 KB de arquivo viram ~683 KB em base64 (4 caracteres a cada 3 bytes), mais o cabeçalho do dataURL
const MAX_BYTES = 500 * 1024
const MAX_DATA_LENGTH = Math.ceil(MAX_BYTES / 3) * 4 + 100

/**
 * Chat: o client manda uma imagem (chat:image) como dataURL em base64.
 * O Event NÃO processa nada: só valida e entrega o trabalho a um worker pela fila "images".
 * Quem gera a miniatura é o ProcessChatImageJob, fora do websocket, que devolve o resultado pelo exchange "results".
 */
export default createEvent({
    name: 'chat:image',
    handle: async (payload, context) => {
        const name = normalizeName(payload?.name)
        const room = normalizeRoom(payload?.room)
        const filename = String(payload?.filename ?? '').trim().slice(0, 100) || 'imagem'
        const data = String(payload?.data ?? '')

        if (!name || !room) {
            return
        }

        if (!data.startsWith('data:image/') || data.length > MAX_DATA_LENGTH) {
            context.socket.emit('chat:image:error', { room, filename, reason: 'Imagem inválida ou maior que 500 KB.' })
            return
        }

        await ProcessChatImageJob.dispatch('images', { name, room, filename, data })
    }
})
