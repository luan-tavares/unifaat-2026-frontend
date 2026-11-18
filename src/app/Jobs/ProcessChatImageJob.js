import { createJob } from '../../utils/job.js'
import rabbit from '../../database/connections/rabbit.js'

/**
 * Processa a imagem recebida no chat (redimensiona e gera miniatura).
 * Roda no worker (fila "images"), nunca no websocket.
 * Ao terminar, publica o resultado no exchange "results" para o websocket entregar aos clients.
 */
export default createJob({
    name: 'ProcessChatImageJob',
    handle: async (payload) => {
        const { name, room, filename, data } = payload

        // Simula o processamento pesado (3 s) — substitua por sharp se disponível
        await new Promise(resolve => setTimeout(resolve, 3000))

        // O "thumb" é a própria imagem (simulação); em produção seria a miniatura gerada pelo sharp
        const thumb = data

        // Publica o resultado no exchange "results": o websocket entrega para a sala
        await rabbit.notify('results', 'chat:image', { name, room, filename, thumb })
    }
})
