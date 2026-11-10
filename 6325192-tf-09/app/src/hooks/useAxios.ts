import { useEffect, useState } from 'react'
import { isAxiosError, isCancel } from 'axios'
import { clientApi } from '../api/clientApi'

type ResponseState<T> = { url: string; attempt: number; value: T }
type ErrorState = { url: string; attempt: number; message: string }

export function useAxios<T>(url: string | null) {
  const [response, setResponse] = useState<ResponseState<T> | null>(null)
  const [failure, setFailure] = useState<ErrorState | null>(null)
  const [isRequesting, setIsRequesting] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (url === null) {
      return
    }
    const controller = new AbortController()
    const active = { current: true }

    async function execute() {
      setIsRequesting(true)
      setFailure(null)
      try {
        const result = await clientApi.get<T>(url as string, { signal: controller.signal })
        if (!active.current) return
        setResponse({ url: url as string, attempt, value: result.data })
      } catch (err: unknown) {
        if (!active.current || isCancel(err)) return
        const message = isAxiosError(err) ? err.message : 'Erro inesperado ao consultar a API'
        setFailure({ url: url as string, attempt, message })
      } finally {
        if (active.current) setIsRequesting(false)
      }
    }
    void execute()
    return () => {
      active.current = false
      controller.abort()
    }
  }, [url, attempt])

  function refetch() {
    setAttempt(current => current + 1)
  }

  const data = response?.url === url && response.attempt === attempt ? response.value : null
  const error = failure?.url === url && failure.attempt === attempt ? failure.message : null
  const isLoading = url !== null && (isRequesting || (data === null && error === null))
  return { data, error, isLoading, refetch }
}
