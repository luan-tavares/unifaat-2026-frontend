import redis from '../../../database/connections/redis.js'
import ChatMessageService from '../../Services/ChatMessageService.js'
import { cacheRequests } from '../../../utils/metrics.js'
import { CHAT_RECENT_KEY } from '../../../utils/cacheKeys.js'

const CACHE_TTL_SECONDS = 60
const METRIC_ENDPOINT = 'recent'

/**
 * GET /api/mensagens/recentes: as 10 últimas mensagens do chat com cache-aside no Redis.
 * Mesmo desenho do ReportController; a diferença é que o worker save-message apaga a chave
 * quando grava uma mensagem nova, então o cache não fica velho até o TTL.
 */
export default async function RecentMessagesController(request, response) {
    try {
        const isCacheOn = (await redis.get('cache:ativo')) === '1'

        if (isCacheOn) {
            const cached = await redis.get(CHAT_RECENT_KEY)

            if (cached) {
                cacheRequests.inc({ result: 'hit', endpoint: METRIC_ENDPOINT })
                response.set('X-Cache', 'HIT')
                return response.json(JSON.parse(cached))
            }
        }

        const messages = await ChatMessageService.recent()

        if (isCacheOn) {
            await redis.set(CHAT_RECENT_KEY, JSON.stringify(messages), CACHE_TTL_SECONDS)
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
