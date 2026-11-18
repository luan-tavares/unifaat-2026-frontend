import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'

const THUMB_WIDTH = 240

/**
 * Trabalho "pesado" do chat: gera a miniatura da imagem (sharp) e avisa o resultado pelo exchange "results".
 * Roda no worker da fila "images"; o websocket recebe o resultado e entrega à sala.
 */
export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { name, room, filename, data } = payload

        // Import dinâmico: quem só carrega os Jobs (websocket, outros workers) não precisa do sharp instalado
        const { default: sharp } = await import('sharp')

        const base64 = data.slice(data.indexOf(',') + 1)
        const buffer = await sharp(Buffer.from(base64, 'base64'))
            .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
            .jpeg({ quality: 70 })
            .toBuffer()

        const thumb = `data:image/jpeg;base64,${buffer.toString('base64')}`

        await rabbit.notify('results', 'chat:image', { name, room, filename, thumb })

        console.log(`Miniatura de ${filename} (${name}, sala ${room}) enviada para o exchange results`)
    }
})
