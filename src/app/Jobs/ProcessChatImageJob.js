import { createJob } from '../../utils/job.js'
import { sleep } from '../../utils/sleep.js'
import rabbit from '../../database/connections/rabbit.js'

const THUMB_SIZE = 240

// O sharp é nativo e pesado: carrega só no worker (nunca no websocket) e só uma vez.
// Se ele não estiver instalado (ex.: volume node_modules antigo), o job simula o peso com uma espera.
let sharpPromise = null

function loadSharp() {
    sharpPromise ??= import('sharp').then((module) => module.default).catch(() => null)

    return sharpPromise
}

async function makeThumb(data) {
    const sharp = await loadSharp()

    if (!sharp) {
        console.warn('sharp não instalado: simulando o processamento com 3 s de espera (a miniatura é a própria imagem)')
        await sleep(3) // o sleep do projeto recebe SEGUNDOS

        return data
    }

    const base64 = data.slice(data.indexOf(',') + 1)
    const buffer = await sharp(Buffer.from(base64, 'base64'))
        .rotate()
        .resize({ width: THUMB_SIZE, height: THUMB_SIZE, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 70 })
        .toBuffer()

    return `data:image/webp;base64,${buffer.toString('base64')}`
}

/**
 * Job da fila "images": o trabalho pesado do upload do chat roda AQUI, no worker, e não no websocket.
 * Gera a miniatura e avisa o resultado pelo exchange "results", que cada websocket assina para entregar à sala.
 */
export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { name, room, filename, data } = payload

        const thumb = await makeThumb(data)

        await rabbit.notify('results', 'chat:image', { name, room, filename, thumb, sentAt: Date.now() })
    }
})
