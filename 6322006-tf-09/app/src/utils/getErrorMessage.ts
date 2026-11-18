import { isAxiosError } from "axios"

// Usa a mensagem do backend quando ela vem no corpo da resposta; senão, o texto padrão
export function getErrorMessage(err: unknown, fallback: string): string {
    if (!isAxiosError<{ message?: unknown }>(err)) return fallback

    const message = err.response?.data?.message
    if (typeof message !== "string" || message === "") return fallback

    return message
}
