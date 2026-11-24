import { createJob } from '../../utils/job.js'
import MessageModel from '../Models/MessageModel.js'
import redis from '../../database/connections/redis.js'

const CHAT_RECENT_CACHE_KEY = 'report:chat-recent'
const CHAT_RANKING_CACHE_KEY = 'report:chat-ranking'

/**
 * Fila save-message. Disparado pelo Event chat:message do websocket: o websocket só distribui a mensagem
 * e entrega este job a um worker, que grava no Postgres (ip, name, message, date) fora do túnel.
 */
export default createJob({
    name: 'SaveMessageJob',
    handle: async (payload) => {
        const { ip, name, message, sentAt } = payload

        await MessageModel.create({ ip, name, message, date: new Date(sentAt) })
        await redis.del(CHAT_RECENT_CACHE_KEY)
        await redis.del(CHAT_RANKING_CACHE_KEY)

        console.log(`Mensagem de ${name} (${ip}) salva no Postgres`)
    }
})
