import sharp from 'sharp'
import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'

/**
 * Disparado pelo Event chat:image. Roda no worker da fila "images" (fora do websocket):
 * gera a miniatura da imagem e avisa o resultado pelo exchange "results".
 */
export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { name, room, filename, data } = payload

        const base64 = data.slice(data.indexOf(',') + 1)
        const buffer = Buffer.from(base64, 'base64')

        const thumbBuffer = await sharp(buffer)
            .resize({ width: 240, height: 240, fit: 'inside', withoutEnlargement: true })
            .webp()
            .toBuffer()

        const thumb = `data:image/webp;base64,${thumbBuffer.toString('base64')}`

        await rabbit.notify('results', 'chat:image', { name, room, filename, thumb, sentAt: Date.now() })

        console.log(`Miniatura gerada: ${filename} (${name} em #${room})`)
    }
})
