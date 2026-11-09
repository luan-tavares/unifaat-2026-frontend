import { useEffect, useState } from 'react'
import axios, { isCancel } from 'axios'
import { clientApi } from '../api/clientApi'

type UseAxiosResult<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
  refetch: () => void
}

export const useAxios = <T,>(url: string | null): UseAxiosResult<T> => {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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

    const loadData = async (): Promise<void> => {
      try {
        const response = await clientApi.get<T>(url, {
          signal: controller.signal,
        })
        setData(response.data)
      } catch (err: unknown) {
        if (!isCancel(err)) {
          const message = axios.isAxiosError(err)
            ? err.message
            : 'Não foi possível carregar os dados.'
          setError(message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      controller.abort()
    }
  }, [url, attempt])

  const refetch = (): void => {
    setAttempt((currentAttempt) => currentAttempt + 1)
  }

  return { data, error, isLoading, refetch }
}
