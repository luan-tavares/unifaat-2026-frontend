import { useEffect, useRef, useState } from "react"
import { isCancel } from "axios"
import clientApi from "../api/clientApi"

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

  // Ref para contar quantas respostas já chegaram — não renderiza a tela
  const responseCountRef = useRef(0)

  useEffect(() => {
    if (url === null) {
      setData(null)
      setIsLoading(false)
      return
    }

    const target = url
    const controller = new AbortController()
    const request = { isPending: true }

    async function load() {
      setIsLoading(true)
      setError("")

      try {
        const response = await clientApi.get<T>(target, {
          signal: controller.signal,
        })
        request.isPending = false
        responseCountRef.current += 1
        setData(response.data)
      } catch (err) {
        if (isCancel(err)) return
        request.isPending = false
        setError(
          err instanceof Error ? err.message : "Erro ao carregar os dados"
        )
      }

      setIsLoading(false)
    }

    load()

    return () => {
      if (!request.isPending) return
      controller.abort()
    }
  }, [url, attempt])

  function refetch() {
    setAttempt((current) => current + 1)
  }

  return { data, error, isLoading, refetch }
}
