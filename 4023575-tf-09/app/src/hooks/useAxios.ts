import { useState, useEffect } from 'react'
import axios from 'axios'
import clientApi from '../api/clientApi'

interface UseAxiosResult<T> {
  data: T | null
  error: string | null
  isLoading: boolean
  refetch: () => void
}

function useAxios<T>(url: string | null): UseAxiosResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [attempt, setAttempt] = useState<number>(0)

  useEffect(() => {
    if (url === null) {
      return
    }

    const controller = new AbortController()

    setIsLoading(true)
    setError(null)

    async function fetchData() {
      try {
        const response = await clientApi.get<T>(url as string, {
          signal: controller.signal,
        })
        setData(response.data)
      } catch (err) {
        if (axios.isCancel(err)) {
          return
        }
        const message = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(message)
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      controller.abort()
    }
  }, [url, attempt])

  function refetch() {
    setAttempt((current) => current + 1)
  }

  return { data, error, isLoading, refetch }
}

export default useAxios
