import { useState, useEffect } from 'react'
import { clientApi } from '../api/clientApi'
import { isCancel } from 'axios'

interface UseAxiosResult<T> {
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

  const refetch = () => {
    setAttempt((prev) => prev + 1)
  }

  useEffect(() => {
    if (url === null) {
      return
    }

    const controller = new AbortController()

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await clientApi.get<T>(url, {
          signal: controller.signal
        })
        setData(response.data)
      } catch (err) {
        if (isCancel(err)) {
          return
        }
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    return () => {
      controller.abort()
    }
  }, [url, attempt])

  return { data, error, isLoading, refetch }
}
