import redis from '../../../database/connections/redis.js'
import ChatReportService from '../../Services/ChatReportService.js'
import { cacheRequests } from '../../../utils/metrics.js'

const CACHE_KEY = 'report:chat-recent'
const CACHE_TTL_SECONDS = 60
const ENDPOINT = '/api/mensagens/recentes'

export default async function RecentMessagesController(request, response) {
    try {
        const isCacheOn = (await redis.get('cache:ativo')) === '1'

        if (isCacheOn) {
            const cached = await redis.get(CACHE_KEY)

            if (cached) {
                cacheRequests.inc({ result: 'hit', endpoint: ENDPOINT })
                response.set('X-Cache', 'HIT')
                return response.json(JSON.parse(cached))
            }
        }

        const recentMessages = await ChatReportService.recentMessages()

        if (isCacheOn) {
            await redis.set(CACHE_KEY, JSON.stringify(recentMessages), CACHE_TTL_SECONDS)
        }

        cacheRequests.inc({ result: 'miss', endpoint: ENDPOINT })
        response.set('X-Cache', 'MISS')
        return response.json(recentMessages)
    } catch (error) {
        console.error(error)

        return response.status(500).json({
            error: 'Internal server error'
        })
    }
}