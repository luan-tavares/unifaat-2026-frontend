import redis from '../../../database/connections/redis.js'
import ChatMessageService from '../../Services/ChatMessageService.js'
import { cacheRequests } from '../../../utils/metrics.js'

const CACHE_KEY = 'report:chat-recent'
const CACHE_TTL_SECONDS = 60
const METRICS_ENDPOINT = 'mensagens-recentes'

/**
 * GET /api/mensagens/recentes: as 10 últimas mensagens do chat com cache-aside no Redis.
 * Igual ao /api/relatorio: pergunta ao Redis (HIT); se não está lá (MISS), consulta o Postgres, grava com TTL e responde.
 * Além do TTL, a chave é apagada pelo worker da fila save-message quando grava uma mensagem nova (invalidação).
 */
export default async function RecentMessagesController(request, response) {
    try {
        const isCacheOn = (await redis.get('cache:ativo')) === '1'

        if (isCacheOn) {
            const cached = await redis.get(CACHE_KEY)

            if (cached) {
                cacheRequests.inc({ result: 'hit', endpoint: METRICS_ENDPOINT })
                response.set('X-Cache', 'HIT')
                return response.json(JSON.parse(cached))
            }
        }

        const messages = await ChatMessageService.recent()

        if (isCacheOn) {
            await redis.set(CACHE_KEY, JSON.stringify(messages), CACHE_TTL_SECONDS)
        }

        cacheRequests.inc({ result: 'miss', endpoint: METRICS_ENDPOINT })
        response.set('X-Cache', 'MISS')
        return response.json(messages)
    } catch (error) {
        console.error(error)

        return response.status(500).json({
            error: 'Internal server error'
        })
    }
}
