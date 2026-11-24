import { createJob } from '../../utils/job.js'
import redis from '../../database/connections/redis.js'
import MessageModel from '../Models/MessageModel.js'

// Chaves de cache que dependem da tabela messages: o relatório (ranking) e as mensagens recentes
const CACHE_KEYS_TO_INVALIDATE = ['report:chat-recent', 'report:chat-ranking']

/**
 * Fila save-message. Disparado pelo Event chat:message do websocket: o websocket só distribui a mensagem
 * e entrega este job a um worker, que grava no Postgres (ip, name, message, date) fora do túnel.
 *
 * Invalidação de cache: quem grava no banco é quem sabe que o dado mudou. Depois do create, o worker apaga as
 * chaves (redis.del) e o próximo GET já é MISS, traz a mensagem nova e não espera o TTL.
 */
export default createJob({
    name: 'SaveMessageJob',
    handle: async (payload) => {
        const { ip, name, message, sentAt } = payload

        await MessageModel.create({ ip, name, message, date: new Date(sentAt) })

        console.log(`Mensagem de ${name} (${ip}) salva no Postgres`)

        // A mensagem já está salva: se o Redis falhar aqui, o erro não pode refazer o job (duplicaria a mensagem).
        // O TTL garante que o cache velho expira sozinho.
        try {
            await Promise.all(CACHE_KEYS_TO_INVALIDATE.map((key) => redis.del(key)))

            console.log(`Cache invalidado: ${CACHE_KEYS_TO_INVALIDATE.join(', ')}`)
        } catch (error) {
            console.error('Falha ao invalidar o cache (expira pelo TTL):', error.message)
        }
    }
})
