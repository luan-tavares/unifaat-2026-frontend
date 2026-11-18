import { isAxiosError } from "axios"

export function getErrorMessage(err: unknown, fallback: string): string {
    if (isAxiosError(err) && err.response) return `${fallback} (HTTP ${err.response.status})`
    if (isAxiosError(err)) return `${fallback}: servidor indisponível`
    if (err instanceof Error) return `${fallback}: ${err.message}`

    return fallback
}
