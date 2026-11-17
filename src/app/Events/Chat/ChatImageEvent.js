import { createEvent } from '../../../utils/event.js'
import ProcessChatImageJob from '../../Jobs/ProcessChatImageJob.js'
import { parseName, parseRoom } from './rooms.js'

// 500 KB de arquivo viram ~683 KB em base64 (4 bytes a cada 3), mais o cabeçalho do dataURL
const MAX_BYTES = 500 * 1024
const MAX_DATA_LENGTH = Math.ceil(MAX_BYTES / 3) * 4 + 100
const DATA_URL = /^data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+/=]+$/

/**
 * Chat: upload de imagem (chat:image { name, room, filename, data }).
 * O websocket só conecta e distribui: este Event NÃO processa nada. Só valida e lança um job na fila
 * "images"; o worker gera a miniatura e devolve o resultado pelo exchange "results".
 */
export default createEvent({
    name: 'chat:image',
    handle: async (payload, context) => {
        const name = parseName(payload?.name)
        const room = parseRoom(payload?.room)
        const filename = String(payload?.filename ?? '').trim().slice(0, 100) || 'imagem'
        const data = String(payload?.data ?? '')

        if (!name || !room) {
            return
        }

        if (data.length > MAX_DATA_LENGTH || !DATA_URL.test(data)) {
            context.socket.emit('chat:image:error', { room, filename, message: 'Imagem inválida ou maior que 500 KB.' })
            return
        }

        await ProcessChatImageJob.dispatch('images', { name, room, filename, data })

        // Responde na hora só para o autor: a imagem está na fila, esperando um worker
        context.socket.emit('chat:image:queued', { room, filename })
    }
})
