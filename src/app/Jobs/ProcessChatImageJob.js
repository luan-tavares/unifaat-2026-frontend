import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'
import { sleep } from '../../utils/sleep.js'

const THUMB_SIZE = 160

// Miniatura com sharp; se não der (ex.: binário indisponível), simula o peso com 3 s e devolve a original
async function createThumb(data) {
    try {
        const { default: sharp } = await import('sharp')
        const buffer = Buffer.from(data.split(',')[1], 'base64')
        const resized = await sharp(buffer).resize(THUMB_SIZE, THUMB_SIZE, { fit: 'inside' }).png().toBuffer()

        return `data:image/png;base64,${resized.toString('base64')}`
    } catch (error) {
        console.warn('sharp indisponível, simulando o processamento:', error.message)
        await sleep(3)

        return data
    }
}

export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { name, room, filename, data } = payload
        const thumb = await createThumb(data)

        // Devolve o resultado por outro exchange: o websocket assina e entrega à sala
        await rabbit.notify('results', 'chat:image', { name, room, filename, thumb, sentAt: Date.now() })
    }
})
