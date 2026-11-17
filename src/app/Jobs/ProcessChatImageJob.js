import sharp from 'sharp'
import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'

const THUMB_SIZE = 240

/**
 * Trabalho "pesado" do chat, fora do websocket: roda no worker da fila "images".
 * Lê o dataURL, gera a miniatura com o sharp e avisa o resultado pelo exchange "results";
 * o websocket assina esse exchange e entrega o chat:image para a sala.
 */
export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { name, room, filename, data } = payload
        const base64 = String(data ?? '').split(',')[1] ?? ''
        const buffer = Buffer.from(base64, 'base64')

        const thumbBuffer = await sharp(buffer)
            .rotate()
            .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer()

        const thumb = `data:image/webp;base64,${thumbBuffer.toString('base64')}`

        console.log(`Miniatura gerada: ${filename} (${buffer.length} → ${thumbBuffer.length} bytes)`)

        await rabbit.notify('results', 'chat:image', { name, room, filename, thumb, sentAt: Date.now() })
    }
})
