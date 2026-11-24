import { useEffect, useState } from "react"
import axios from "axios"

type RecentMessage = {
    id: number
    name: string
    message: string
    date: string
}

type Lookup = {
    messages: RecentMessage[]
    isHit: boolean
    ms: number
}

function formatDate(date: string): string {
    return new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

// O registro do Gotei: as 10 últimas mensagens gravadas no Postgres (GET /api/mensagens/recentes, TF-11).
// O selo mostra de onde veio a resposta (header X-Cache): HIT = Redis, MISS = Postgres. Mandar mensagem no chat
// invalida o cache no worker, então a próxima consulta volta MISS já com a mensagem nova.
export function RecentMessages() {
    const [lookup, setLookup] = useState<Lookup | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    async function consultar() {
        setIsLoading(true)
        setError("")

        const start = performance.now()

        try {
            const response = await axios.get<RecentMessage[]>("/api/mensagens/recentes")

            setLookup({
                messages: response.data,
                isHit: response.headers["x-cache"] === "HIT",
                ms: Math.round(performance.now() - start)
            })
        } catch {
            setError("O registro não respondeu.")
        }

        setIsLoading(false)
    }

    useEffect(() => {
        consultar()
    }, [])

    const badgeClass = lookup?.isHit ? "cache-badge hit" : "cache-badge miss"
    const badgeLabel = lookup?.isHit ? "HIT · Redis" : "MISS · Postgres"

    return (
        <div className="card mt-3">
            <div className="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                    <span className="kanji" aria-hidden="true">記録</span>
                    <strong>Registro do Gotei: últimas 10 mensagens</strong>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {lookup && <span className={badgeClass}>{badgeLabel} · {lookup.ms} ms</span>}
                    <button className="btn btn-sm btn-outline-primary" type="button" disabled={isLoading} onClick={consultar}>
                        {isLoading ? "Consultando..." : "Consultar"}
                    </button>
                </div>
            </div>

            <ul className="list-group list-group-flush">
                {error !== "" && <li className="list-group-item text-danger">{error}</li>}
                {lookup?.messages.length === 0 && <li className="list-group-item text-muted">Nenhuma mensagem gravada ainda.</li>}

                {lookup?.messages.map(item => (
                    <li key={item.id} className="list-group-item d-flex gap-3 align-items-baseline">
                        <code>{formatDate(item.date)}</code>
                        <strong>{item.name}</strong>
                        <span className="text-truncate">{item.message}</span>
                    </li>
                ))}
            </ul>
        </div>
    )
}
