
import { useEffect, useState } from 'react'
import { isCancel } from 'axios'
import clientApi from '../api/clientApi'

interface UseAxiosResponse<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  refetch: () => void
}

const useAxios = <T,>(url: string | null): UseAxiosResponse<T> => {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (url === null) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    setIsLoading(true)
    setError(null)

    const fetchData = async (): Promise<void> => {
      try {
        const response = await clientApi.get<T>(url, {
          signal: controller.signal,
        })

        if (!controller.signal.aborted) {
          setData(response.data)
        }
      } catch (err: unknown) {
        if (isCancel(err)) {
          return
        }

        if (!controller.signal.aborted) {
          const message =
            err instanceof Error ? err.message : 'Erro ao buscar dados.'

          setError(message)
          setData(null)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchData()

    return () => {
      controller.abort()
    }
  }, [url, attempt])

  const refetch = (): void => {
    setAttempt((previous) => previous + 1)
  }

  return {
    data,
    error,
    isLoading,
    refetch,
  }
}

export default useAxios
