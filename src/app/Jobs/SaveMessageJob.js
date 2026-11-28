import { createJob } from '../../utils/job.js'
import MessageModel from '../Models/MessageModel.js'
import redis from '../../database/connections/redis.js'

// Chaves de cache que dependem da tabela messages: ficam velhas quando entra uma mensagem nova
const CACHE_KEYS_TO_INVALIDATE = ['report:chat-recent', 'report:chat-ranking']

/**
 * Fila save-message. Disparado pelo Event chat:message do websocket: o websocket só distribui a mensagem
 * e entrega este job a um worker, que grava no Postgres (ip, name, message, date) fora do túnel.
 * Depois de gravar, o worker invalida o cache: quem escreve no banco é quem sabe que o dado mudou.
 */
export default createJob({
    name: 'SaveMessageJob',
    handle: async (payload) => {
        const { ip, name, message, sentAt } = payload

        await MessageModel.create({ ip, name, message, date: new Date(sentAt) })
        await Promise.all(CACHE_KEYS_TO_INVALIDATE.map((key) => redis.del(key)))

        console.log(`Mensagem de ${name} (${ip}) salva no Postgres`)
    }
})
