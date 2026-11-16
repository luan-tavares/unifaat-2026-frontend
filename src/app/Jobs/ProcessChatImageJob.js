import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'

const THUMB_SIZE = 200

/**
 * Trabalho "pesado" do chat: gera a miniatura da imagem. Roda no worker da fila "images", nunca no websocket.
 * No fim, avisa o resultado pelo exchange "results"; o servidor websocket entrega o chat:image para a sala.
 */
export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { name, room, filename, data } = payload

        // import dinâmico: só o worker carrega o sharp (o websocket importa este arquivo, mas não executa o handle)
        const { default: sharp } = await import('sharp')

        const base64 = data.slice(data.indexOf(',') + 1)
        const original = Buffer.from(base64, 'base64')

        const resized = await sharp(original)
            .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'inside' })
            .jpeg({ quality: 70 })
            .toBuffer()

        const thumb = `data:image/jpeg;base64,${resized.toString('base64')}`

        await rabbit.notify('results', 'chat:image', { name, room, filename, thumb, sentAt: Date.now() })
    }
})
