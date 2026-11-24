import redis from '../../../database/connections/redis.js'
import ChatReportService from '../../Services/ChatReportService.js'
import { cacheRequests } from '../../../utils/metrics.js'

const CACHE_KEY = 'report:chat-ranking'
const CACHE_TTL_SECONDS = 30

/**
 * GET /api/relatorio: ranking do chat com cache-aside no Redis.
 * Primeiro pergunta ao Redis (HIT); se não está lá (MISS), consulta o Postgres, grava com TTL e responde.
 * A flag cache:ativo liga e desliga o cache sem reiniciar nada (POST /api/admin/cache).
 * O header X-Cache diz de onde veio a resposta: o botão do chat usa para contar os hits.
 */
export default async function ReportController(request, response) {
    try {
        const isCacheOn = (await redis.get('cache:ativo')) === '1'

        if (isCacheOn) {
            const cached = await redis.get(CACHE_KEY)

            if (cached) {
                cacheRequests.inc({ result: 'hit', endpoint: 'relatorio' })
                response.set('X-Cache', 'HIT')
                return response.json(JSON.parse(cached))
            }
        }

        const ranking = await ChatReportService.ranking()

        if (isCacheOn) {
            await redis.set(CACHE_KEY, JSON.stringify(ranking), CACHE_TTL_SECONDS)
        }

        cacheRequests.inc({ result: 'miss', endpoint: 'relatorio' })
        response.set('X-Cache', 'MISS')
        return response.json(ranking)
    } catch (error) {
        console.error(error)

        return response.status(500).json({
            error: 'Internal server error'
        })
    }
}
