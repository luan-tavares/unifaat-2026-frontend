import redis from '../../../database/connections/redis.js'
import ChatRecentService from '../../Services/ChatRecentService.js'
import { cacheRequests } from '../../../utils/metrics.js'

const CACHE_KEY = 'report:chat-recent'
const CACHE_TTL_SECONDS = 60

/**
 * GET /api/mensagens/recentes: as 10 últimas mensagens do chat com cache-aside no Redis.
 * Funciona igual ao ReportController: pergunta ao Redis (HIT), se não há (MISS) consulta o Postgres,
 * grava com TTL de 60 s e responde. A chave é apagada pelo worker save-message quando uma nova
 * mensagem chega, garantindo invalidação antes do TTL esgotar.
 */
export default async function MessagesRecentController(request, response) {
    try {
        const isCacheOn = (await redis.get('cache:ativo')) === '1'

        if (isCacheOn) {
            const cached = await redis.get(CACHE_KEY)

            if (cached) {
                cacheRequests.inc({ result: 'hit', endpoint: 'mensagens-recentes' })
                response.set('X-Cache', 'HIT')
                return response.json(JSON.parse(cached))
            }
        }

        const messages = await ChatRecentService.recent()

        if (isCacheOn) {
            await redis.set(CACHE_KEY, JSON.stringify(messages), CACHE_TTL_SECONDS)
        }

        cacheRequests.inc({ result: 'miss', endpoint: 'mensagens-recentes' })
        response.set('X-Cache', 'MISS')
        return response.json(messages)
    } catch (error) {
        console.error(error)

        return response.status(500).json({
            error: 'Internal server error'
        })
    }
}
