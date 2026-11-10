import { isCancel } from 'axios'
import { useEffect, useState } from 'react'
import clientApi from '../api/clientApi'

type UseAxiosResult<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
  refetch: () => void
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  return 'Não foi possível carregar os dados.'
}

function useAxios<T>(url: string | null): UseAxiosResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(url !== null)
  const [attempt, setAttempt] = useState<number>(0)

  const refetch = () => {
    setAttempt((currentAttempt) => currentAttempt + 1)
  }

  useEffect(() => {
    if (url === null) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    const controller = new AbortController()

    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await clientApi.get<T>(url, {
          signal: controller.signal,
        })
        setData(response.data)
      } catch (requestError: unknown) {
        if (isCancel(requestError)) return
        if (controller.signal.aborted) return
        setError(getErrorMessage(requestError))
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void loadData()

    return () => {
      controller.abort()
    }
  }, [url, attempt])

  return { data, error, isLoading, refetch }
}

export default useAxios
