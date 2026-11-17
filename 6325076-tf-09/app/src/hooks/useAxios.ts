import { useEffect, useState } from 'react'
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
    setData(null)

    async function loadData() {
      try {
        const response = await clientApi.get<T>(url, {
          signal: controller.signal,
        })

        setData(response.data)
      } catch (err: unknown) {
        if (axios.isCancel(err) || controller.signal.aborted) {
          return
        }

        if (axios.isAxiosError(err)) {
          setError(err.message)
          return
        }

        setError('Ocorreu um erro inesperado.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      controller.abort()
    }
  }, [url, attempt])

  function refetch() {
    setAttempt((previous) => previous + 1)
  }

  return { data, error, isLoading, refetch }
}

export default useAxios
