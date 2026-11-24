import { createJob } from '../../utils/job.js'
import redis from '../../database/connections/redis.js'
import MessageModel from '../Models/MessageModel.js'

// Caches que mostram mensagens: ficam velhos assim que uma mensagem nova é gravada
const CHAT_CACHE_KEYS = ['report:chat-recent', 'report:chat-ranking']

/**
 * Fila save-message. Disparado pelo Event chat:message do websocket: o websocket só distribui a mensagem
 * e entrega este job a um worker, que grava no Postgres (ip, name, message, date) fora do túnel.
 * Quem grava é quem sabe que o dado mudou: logo depois do INSERT, apaga os caches do chat (invalidação),
 * e o próximo GET já é MISS e traz a mensagem nova, sem esperar o TTL.
 */
export default createJob({
    name: 'SaveMessageJob',
    handle: async (payload) => {
        const { ip, name, message, sentAt } = payload

        await MessageModel.create({ ip, name, message, date: new Date(sentAt) })

        console.log(`Mensagem de ${name} (${ip}) salva no Postgres`)

        for (const key of CHAT_CACHE_KEYS) {
            await redis.del(key)
        }

        console.log(`Cache invalidado: ${CHAT_CACHE_KEYS.join(', ')}`)
    }
})
