import { useEffect, useState } from "react"
import { isCancel } from "axios"
import clientApi from "../api/clientApi"
import { getErrorMessage } from "../utils/getErrorMessage"

type UseAxiosResult<T> = {
    data: T | null
    error: string
    isLoading: boolean
    refetch: () => void
}

/**
 * GET com Axios + os estados da requisição.
 * - url === null: o hook fica parado (sem requisição).
 * - dependências só primitivas: [url, attempt].
 * - a limpeza cancela a requisição anterior com AbortController.
 */
export function useAxios<T>(url: string | null): UseAxiosResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(url !== null)
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        if (url === null) {
            setData(null)
            setError("")
            setIsLoading(false)
            return
        }

        const target = url
        const controller = new AbortController()

        async function load() {
            setIsLoading(true)
            setError("")

            try {
                const response = await clientApi.get<T>(target, { signal: controller.signal })
                setData(response.data)
            } catch (err) {
                // Cancelamento não é erro: a requisição foi trocada por outra
                if (isCancel(err)) return
                setError(getErrorMessage(err, "Erro ao carregar os dados"))
            }

            setIsLoading(false)
        }

        load()

        return () => {
            controller.abort()
        }
    }, [url, attempt])

    // Só muda um estado: o efeito refaz a chamada
    function refetch() {
        setAttempt(current => current + 1)
    }

    return { data, error, isLoading, refetch }
}
