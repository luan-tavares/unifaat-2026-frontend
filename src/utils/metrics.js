import { Registry, Histogram, Counter, collectDefaultMetrics } from 'prom-client'

/**
 * Métricas do nodeweb, no formato que o Prometheus lê (GET /metrics).
 * O nodeweb só EXPÕE os números; quem busca (pull) e guarda é o Prometheus, quem desenha é o Grafana.
 */
export const register = new Registry()

// Métricas do próprio processo Node: memória, CPU, event loop
collectDefaultMetrics({ register })

// Duração de cada requisição HTTP: o histograma guarda a contagem por faixa de tempo (buckets),
// e é daí que o Grafana calcula o p95
export const httpDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duração das requisições HTTP em segundos',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [register]
})

// Acertos (hit) e erros (miss) do cache, por resultado e endpoint
export const cacheRequests = new Counter({
    name: 'cache_requests_total',
    help: 'Consultas ao cache, por resultado (hit ou miss) e endpoint',
    labelNames: ['result', 'endpoint'],
    registers: [register]
})
