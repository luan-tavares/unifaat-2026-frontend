import { isCancel } from "axios"
import { useEffect, useState } from "react"
import { clientApi } from "../api/clientApi"
import { getErrorMessage } from "../utils/getErrorMessage"

type UseAxiosResult<T> = {
    data: T | null
    error: string | null
    isLoading: boolean
    refetch: () => void
}

export function useAxios<T>(url: string | null): UseAxiosResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [attempt, setAttempt] = useState<number>(0)

    useEffect(() => {
        if (url === null) return

        const controller = new AbortController()

        async function load(currentUrl: string) {
            setIsLoading(true)
            setError(null)

            try {
                const response = await clientApi.get<T>(currentUrl, { signal: controller.signal })
                setData(response.data)
            } catch (err) {
                if (isCancel(err)) return
                setData(null)
                setError(getErrorMessage(err))
            } finally {
                if (!controller.signal.aborted) setIsLoading(false)
            }
        }

        load(url)

        return () => controller.abort()
    }, [url, attempt])

    function refetch() {
        setAttempt((current) => current + 1)
    }

    if (url === null) return { data: null, error: null, isLoading: false, refetch }

    return { data, error, isLoading, refetch }
}
