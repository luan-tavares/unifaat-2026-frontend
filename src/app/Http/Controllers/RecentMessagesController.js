import redis from '../../../database/connections/redis.js'
import ChatReportService from '../../Services/ChatReportService.js'
import { cacheRequests } from '../../../utils/metrics.js'

const CACHE_KEY = 'report:chat-recent'
const CACHE_TTL_SECONDS = 60
const ENDPOINT = 'mensagens-recentes'

/**
 * GET /api/mensagens/recentes: as 10 últimas mensagens do chat, com cache-aside no Redis.
 * Igual ao ReportController: pergunta ao Redis (HIT); se não está lá (MISS), consulta o Postgres pelo
 * Service, grava com TTL e responde. Respeita a flag cache:ativo e informa a origem no header X-Cache.
 * Além do TTL, a chave é apagada pelo worker save-message quando uma mensagem nova é gravada (SaveMessageJob).
 */
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

        const messages = await ChatReportService.recent()

        if (isCacheOn) {
            await redis.set(CACHE_KEY, JSON.stringify(messages), CACHE_TTL_SECONDS)
        }

        cacheRequests.inc({ result: 'miss', endpoint: ENDPOINT })
        response.set('X-Cache', 'MISS')
        return response.json(messages)
    } catch (error) {
        console.error(error)
        return response.status(500).json({
            error: 'Internal server error'
        })
    }
}
