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

export function useAxios<T>(url: string | null): UseAxiosResult<T> {
    const [data, setData] = useState<T | null>(null)
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(url !== null)
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        // Sem url o hook fica parado: nenhuma requisição
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
                if (isCancel(err)) return          // cancelada pela limpeza: não é erro
                setError(getErrorMessage(err, "Erro ao carregar os dados"))
            }

            setIsLoading(false)
        }

        load()

        // Limpeza: cancela a requisição anterior quando a url muda ou o componente sai da tela
        return () => controller.abort()
    }, [url, attempt])

    // Só muda um estado: quem refaz a chamada é o efeito
    function refetch() {
        setAttempt(current => current + 1)
    }

    return { data, error, isLoading, refetch }
}
