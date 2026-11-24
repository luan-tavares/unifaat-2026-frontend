import { createJob } from '../../utils/job.js'
import MessageModel from '../Models/MessageModel.js'
import redis from '../../database/connections/redis.js'

// Caches que dependem da tabela messages: apagados a cada mensagem nova (invalidação)
const RECENT_CACHE_KEY = 'report:chat-recent'
const RANKING_CACHE_KEY = 'report:chat-ranking'

/**
 * Fila save-message. Disparado pelo Event chat:message do websocket: o websocket só distribui a mensagem
 * e entrega este job a um worker, que grava no Postgres (ip, name, message, date) fora do túnel.
 * Depois de gravar, o worker invalida os caches do chat: quem grava é quem sabe que o dado mudou.
 */
export default createJob({
    name: 'SaveMessageJob',
    handle: async (payload) => {
        const { ip, name, message, sentAt } = payload

        await MessageModel.create({ ip, name, message, date: new Date(sentAt) })

        await Promise.all([
            redis.del(RECENT_CACHE_KEY),
            redis.del(RANKING_CACHE_KEY)
        ])

        console.log(`Mensagem de ${name} (${ip}) salva no Postgres; cache do chat invalidado`)
    }
})
