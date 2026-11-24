import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'

/**
 * Fila images. Recebe a imagem em base64 (dataURL), simula o processamento pesado (3 s de espera),
 * e publica o resultado no exchange results para o websocket entregar à sala.
 * O "processamento" aqui é simulado: em produção seria sharp para gerar a miniatura.
 */
export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { name, room, filename, data } = payload

        console.log(`Processando imagem de ${name} (${filename}) para a sala ${room}...`)

        // Simula o trabalho pesado (redimensionamento, geração de miniatura)
        await new Promise((resolve) => setTimeout(resolve, 3000))

        // O thumb é o próprio dataURL (simulação sem sharp): em produção seria a miniatura gerada
        const thumb = data

        await rabbit.notify('results', 'chat:image', { name, room, filename, thumb })

        console.log(`Imagem de ${name} processada e publicada no exchange results`)
    }
})
