import redis from '../../../database/connections/redis.js'
import ChatMessageService from '../../Services/ChatMessageService.js'
import { cacheRequests } from '../../../utils/metrics.js'

const CACHE_KEY = 'report:chat-recent'
const CACHE_TTL_SECONDS = 60
const CACHE_FLAG_KEY = 'cache:ativo'
const METRIC_ENDPOINT = 'mensagens-recentes'

/**
 * GET /api/mensagens/recentes: as 10 últimas mensagens do chat com cache-aside no Redis.
 * Primeiro pergunta ao Redis (HIT); se não está lá (MISS), consulta o Postgres, grava com TTL e responde.
 * Além do TTL, a chave é apagada pelo worker da fila save-message sempre que uma mensagem nova é gravada
 * (invalidação): o próximo GET já é MISS e traz a mensagem nova.
 */
export default async function RecentMessagesController(request, response) {
    try {
        const isCacheOn = (await redis.get(CACHE_FLAG_KEY)) === '1'

        if (isCacheOn) {
            const cached = await redis.get(CACHE_KEY)

            if (cached) {
                cacheRequests.inc({ result: 'hit', endpoint: METRIC_ENDPOINT })
                response.set('X-Cache', 'HIT')
                return response.json(JSON.parse(cached))
            }
        }

        const messages = await ChatMessageService.recent()

        if (isCacheOn) {
            await redis.set(CACHE_KEY, JSON.stringify(messages), CACHE_TTL_SECONDS)
        }

        cacheRequests.inc({ result: 'miss', endpoint: METRIC_ENDPOINT })
        response.set('X-Cache', 'MISS')
        return response.json(messages)
    } catch (error) {
        console.error(error)

        return response.status(500).json({
            error: 'Internal server error'
        })
    }
}
