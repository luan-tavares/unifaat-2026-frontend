import { createJob } from '../../utils/job.js'
import MessageModel from '../Models/MessageModel.js'
import redis from '../../database/connections/redis.js'

const CACHE_KEY_RECENT = 'report:chat-recent'
const CACHE_KEY_RANKING = 'report:chat-ranking'

/**
 * Fila save-message. Disparado pelo Event chat:message do websocket: o websocket só distribui a mensagem
 * e entrega este job a um worker, que grava no Postgres (ip, name, message, date) fora do túnel.
 * Após gravar, invalida as chaves de cache que dependem da tabela messages, para que o próximo
 * GET já seja MISS e traga o dado novo sem esperar o TTL.
 */
export default createJob({
    name: 'SaveMessageJob',
    handle: async (payload) => {
        const { ip, name, message, sentAt } = payload

        await MessageModel.create({ ip, name, message, date: new Date(sentAt) })

        await redis.del(CACHE_KEY_RECENT)
        await redis.del(CACHE_KEY_RANKING)

        console.log(`Mensagem de ${name} (${ip}) salva no Postgres`)
    }
})
