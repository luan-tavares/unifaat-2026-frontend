import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'
import { sleep } from '../../utils/sleep.js'

const THUMB_WIDTH = 320

// sharp é opcional: se não estiver instalado no container, o job simula o trabalho pesado
async function loadSharp() {
    try {
        const module = await import('sharp')
        return module.default
    } catch {
        return null
    }
}

// Gera a miniatura (dataURL webp) com o sharp; sem sharp, espera 3 s e devolve a própria imagem
async function makeThumb(data) {
    const sharp = await loadSharp()

    if (!sharp) {
        console.warn('sharp não está disponível: simulando o processamento (3 s)')
        await sleep(3)
        return data
    }

    const base64 = data.slice(data.indexOf(',') + 1)
    const buffer = Buffer.from(base64, 'base64')
    const thumb = await sharp(buffer)
        .rotate()
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer()

    return `data:image/webp;base64,${thumb.toString('base64')}`
}

/**
 * Roda no worker da fila "images" (nodeworker-images-container), NUNCA no websocket.
 * Faz o pesado (miniatura) e avisa o resultado pelo exchange "results": cada websocket tem a sua
 * fila dinâmica ligada a ele e entrega o chat:image para quem está na sala.
 */
export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { name, room, filename, data } = payload

        const thumb = await makeThumb(data)

        await rabbit.notify('results', 'chat:image', { name, room, filename, thumb, sentAt: Date.now() })

        console.log(`Imagem "${filename}" de ${name} processada para a sala ${room}`)
    }
})
