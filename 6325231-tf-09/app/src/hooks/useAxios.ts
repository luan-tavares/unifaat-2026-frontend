import { useEffect, useState } from 'react'
import { isCancel } from 'axios'
import clientApi from '../api/clientApi'

type UseAxiosResult<T> = {
  data: T | null
  error: string
  isLoading: boolean
  refetch: () => void
}

export function useAxios<T>(url: string | null): UseAxiosResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(url !== null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (url === null) {
      setIsLoading(false)
      return
    }

    const target = url
    const controller = new AbortController()

    async function load() {
      setIsLoading(true)
      setError('')

      try {
        const response = await clientApi.get<T>(target, { signal: controller.signal })
        setData(response.data)
        setIsLoading(false)
      } catch (err) {
        if (isCancel(err)) return

        const message = err instanceof Error ? err.message : 'Erro ao carregar os dados'
        setError(message)
        setIsLoading(false)
      }
    }

    load()

    return () => {
      controller.abort()
    }
  }, [url, attempt])

  function refetch() {
    setAttempt(current => current + 1)
  }

  return { data, error, isLoading, refetch }
}
