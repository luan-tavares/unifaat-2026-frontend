import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'

const THUMB_WIDTH = 320
const RESULTS_EXCHANGE = 'results'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Gera a miniatura com o sharp (redimensiona para no máximo 320 px de largura e converte para webp).
 * Se o sharp não estiver instalado no container, simula o peso com uma espera de 3 s e devolve a própria imagem.
 */
async function makeThumb(data) {
    const sharpModule = await import('sharp').catch(() => null)

    if (!sharpModule) {
        await sleep(3000)
        return data
    }

    const base64 = data.slice(data.indexOf(',') + 1)
    const input = Buffer.from(base64, 'base64')

    const output = await sharpModule.default(input)
        .rotate()
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer()

    return `data:image/webp;base64,${output.toString('base64')}`
}

/**
 * O trabalho pesado do upload de imagem: roda no WORKER (fila "images"), nunca no websocket.
 * No fim, avisa o resultado por OUTRO exchange ("results"): cada websocket assina esse exchange
 * com a sua fila dinâmica e entrega o chat:image para quem está na sala.
 */
export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { name, room, filename, data } = payload

        const thumb = await makeThumb(data)

        await rabbit.notify(RESULTS_EXCHANGE, 'chat:image', { name, room, filename, thumb, sentAt: Date.now() })

        console.log(`Imagem "${filename}" de ${name} processada para a sala ${room}`)
    }
})
