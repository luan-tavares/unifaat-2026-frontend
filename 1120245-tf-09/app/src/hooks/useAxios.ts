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

  useEffect(() => {
    if (url === null) {
      setData(null)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const resolvedUrl = url
    let isPending = true

    async function load() {
      setIsLoading(true)
      setError("")

      try {
        const response = await clientApi.get<T>(resolvedUrl, { signal: controller.signal })
        isPending = false
        setData(response.data)
      } catch (err) {
        if (isCancel(err)) return
        isPending = false
        setError("Erro ao carregar os dados. Verifique sua conexão.")
      }

      setIsLoading(false)
    }

    load()

    return () => {
      if (!isPending) return
      controller.abort()
    }
  }, [url, attempt])

  function refetch() {
    setAttempt((current) => current + 1)
  }

  return { data, error, isLoading, refetch }
}
