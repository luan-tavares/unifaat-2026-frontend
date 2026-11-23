import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'

/**
 * Fila images. Disparado pelo ChatImageEvent: recebe { name, room, filename, data } e
 * gera uma miniatura com sharp (ou simula o processamento).
 * No fim avisa o resultado pelo exchange results: o _websocket.js entrega chat:image para a sala.
 */
export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { name, room, filename, data } = payload

        console.log(`Processando imagem de ${name} (${filename}) na sala ${room}...`)

        let thumb = data

        try {
            // Tenta usar sharp para gerar uma miniatura real
            const { default: sharp } = await import('sharp')

            // O dataURL tem o formato: data:image/png;base64,<dados>
            const base64 = data.split(',')[1]
            const buffer = Buffer.from(base64, 'base64')

            const resized = await sharp(buffer)
                .resize({ width: 320, withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer()

            thumb = `data:image/jpeg;base64,${resized.toString('base64')}`

            console.log(`Miniatura gerada para ${filename}`)
        } catch {
            // sharp não disponível: simula o processamento com uma espera
            console.warn('sharp não disponível, simulando processamento (3 s)...')
            await new Promise(resolve => setTimeout(resolve, 3000))
        }

        // Avisa o resultado pelo exchange results; o _websocket.js entrega para a sala
        await rabbit.notify('results', 'chat:image', { name, room, filename, thumb })

        console.log(`Imagem de ${name} processada e enviada pelo exchange results`)
    }
})
