import { useState } from "react"
import axios from "axios"

type Result = { ms: number, isHit: boolean } | null

type Summary = {
    ok: number
    errors: number
    hits: number
    averageMs: number
}

const TOTAL_REQUESTS = 50

// Uma requisição ao ranking do chat: devolve o tempo (ms) e se veio do cache (header X-Cache), ou null se falhou
async function measure(): Promise<Result> {
    const start = performance.now()

    try {
        const response = await axios.get("/api/relatorio")

        return { ms: performance.now() - start, isHit: response.headers["x-cache"] === "HIT" }
    } catch {
        return null
    }
}

// O botão que manda requisições: a sala toda clica ao mesmo tempo e o servidor sente (e o cache aparece nos hits)
export function LoadButton() {
    const [isLoading, setIsLoading] = useState(false)
    const [summary, setSummary] = useState<Summary | null>(null)

    // Clique: dispara TOTAL_REQUESTS requisições de uma vez e resume o resultado na tela
    async function aoDispararRequisicoes() {
        setIsLoading(true)

        const results = await Promise.all(Array.from({ length: TOTAL_REQUESTS }, () => measure()))
        const done = results.filter((result): result is NonNullable<Result> => result !== null)
        const total = done.reduce((sum, result) => sum + result.ms, 0)
        const average = done.length > 0 ? total / done.length : 0

        setSummary({
            ok: done.length,
            errors: TOTAL_REQUESTS - done.length,
            hits: done.filter(result => result.isHit).length,
            averageMs: Math.round(average)
        })
        setIsLoading(false)
    }

    return (
        <div className="card mt-3">
            <div className="card-header d-flex align-items-center gap-2">
                <span className="kanji" aria-hidden="true">霊圧</span>
                <strong>Carga na API: liberar reiatsu</strong>
            </div>

            <div className="card-body d-flex flex-column gap-2">
                <button className="btn btn-primary" type="button" disabled={isLoading} onClick={aoDispararRequisicoes}>
                    {isLoading ? "Disparando..." : `Disparar ${TOTAL_REQUESTS} requisições`}
                </button>

                {summary && (
                    <small className="text-muted">
                        {summary.ok} ok · {summary.errors} erros · {summary.hits} do cache · média de {summary.averageMs} ms
                    </small>
                )}
            </div>
        </div>
    )
}
