import { useEffect, useState } from "react"
import { isCancel } from "axios"
import { clientApi } from "../api/clientApi"

interface UseAxiosResult<T> {
    data: T | null
    error: string | null
    isLoading: boolean
    refetch: () => void
}

export function useAxios<T>(url: string | null): UseAxiosResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(url !== null)
    const [attempt, setAttempt] = useState<number>(0)

    useEffect(() => {
        if (url === null) {
            setData(null)
            setError(null)
            setIsLoading(false)
            return
        }

        const controller = new AbortController()

        async function load(target: string): Promise<void> {
            setIsLoading(true)
            setError(null)
            setData(null)
            try {
                const response = await clientApi.get<T>(target, {
                    signal: controller.signal
                })
                setData(response.data)
            } catch (err) {
                if (isCancel(err)) {
                    return
                }
                setData(null)
                setError(err instanceof Error ? err.message : "Erro desconhecido")
            }
            setIsLoading(false)
        }

        load(url)

        return () => {
            controller.abort()
        }
    }, [url, attempt])

    function refetch(): void {
        setAttempt((previous) => previous + 1)
    }

    return { data, error, isLoading, refetch }
}
