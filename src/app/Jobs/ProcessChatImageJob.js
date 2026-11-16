import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'

/**
 * Job: processa a imagem enviada no chat (gera miniatura) e publica o resultado no exchange results.
 * O trabalho "pesado" fica aqui, fora do websocket.
 */
export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { name, room, filename, data } = payload

        console.log(`Processando imagem de ${name} na sala ${room}: ${filename}`)

        // Simula o trabalho pesado (ex.: gerar miniatura com sharp)
        // Por simplicidade, apenas aguardamos 3 segundos
        await new Promise(resolve => setTimeout(resolve, 3000))

        // Por enquanto, mantemos a imagem original como "thumb"
        // Em produção, aqui seria gerada uma miniatura com sharp
        const thumb = data

        console.log(`Imagem processada: ${filename}`)

        // Publica o resultado no exchange results
        await rabbit.connect()
        await rabbit.notify('results', 'chat:image', { name, room, filename, thumb, sentAt: Date.now() })
    }
})
