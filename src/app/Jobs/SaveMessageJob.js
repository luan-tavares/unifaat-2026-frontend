import { createJob } from '../../utils/job.js'
import MessageModel from '../Models/MessageModel.js'
import redis from '../../database/connections/redis.js'
import { CHAT_RANKING_KEY, CHAT_RECENT_KEY } from '../../utils/cacheKeys.js'

/**
 * Fila save-message. Disparado pelo Event chat:message do websocket: o websocket só distribui a mensagem
 * e entrega este job a um worker, que grava no Postgres (ip, name, message, date) fora do túnel.
 * Quem grava é quem sabe que o dado mudou: depois do create, o worker apaga o cache que ficou velho.
 */
export default createJob({
    name: 'SaveMessageJob',
    handle: async (payload) => {
        const { ip, name, message, sentAt } = payload

        await MessageModel.create({ ip, name, message, date: new Date(sentAt) })

        await redis.del(CHAT_RECENT_KEY)
        await redis.del(CHAT_RANKING_KEY)

        console.log(`Mensagem de ${name} (${ip}) salva no Postgres`)
    }
})
