import { createEvent } from '../../../utils/event.js'
import { chatRoomOf } from '../../../utils/chatRooms.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'

// 500 KB de arquivo viram ~683 KB em base64 (4 caracteres para cada 3 bytes), mais o cabeçalho do dataURL
const MAX_DATA_LENGTH = Math.ceil((500 * 1024) / 3) * 4 + 100

/**
 * Chat: o client manda uma imagem (chat:image { name, room, filename, data }), com data = dataURL em base64.
 * O Event NÃO processa nada: só valida e lança o job na fila "images". Quem gera a miniatura é o worker,
 * e o resultado volta pelo exchange "results". O websocket só conecta e distribui.
 */
export default createEvent({
    name: 'chat:image',
    handle: async (payload, context) => {
        const name = String(context.socket.data.name ?? payload?.name ?? '').trim().slice(0, 30)
        const room = chatRoomOf(payload?.room)
        const filename = String(payload?.filename ?? '').trim().slice(0, 100) || 'imagem'
        const data = String(payload?.data ?? '')

        if (!name || !room) {
            return
        }

        if (!data.startsWith('data:image/') || data.length > MAX_DATA_LENGTH) {
            context.socket.emit('chat:image-error', { filename, message: 'Imagem inválida ou maior que 500 KB.' })
            return
        }

        await ProcessChatImageJob.dispatch('images', { name, room, filename, data })
    }
})
