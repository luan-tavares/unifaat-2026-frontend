import { useEffect, useState } from "react"
import { isCancel } from "axios"
import { clientApi } from "../api/clientApi"
import { getErrorMessage } from "../api/getErrorMessage"

type UseAxiosResult<T> = {
    data: T | null
    error: string | null
    isLoading: boolean
    refetch: () => void
}

export const useAxios = <T,>(url: string | null): UseAxiosResult<T> => {
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [attempt, setAttempt] = useState<number>(0)

    useEffect(() => {
        if (url === null) {
            setData(null)
            setError(null)
            setIsLoading(false)
            return undefined
        }

        const controller = new AbortController()

        const load = async (): Promise<void> => {
            setIsLoading(true)
            setError(null)
            setData(null)
            try {
                const response = await clientApi.get<T>(url, { signal: controller.signal })
                setData(response.data)
                setIsLoading(false)
            } catch (err) {
                if (isCancel(err)) {
                    return
                }
                setError(getErrorMessage(err))
                setIsLoading(false)
            }
        }

        load()

        return () => {
            controller.abort()
        }
    }, [url, attempt])

    const refetch = (): void => {
        setAttempt((current) => current + 1)
    }

    return { data, error, isLoading, refetch }
}
