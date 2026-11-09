import { useState, useEffect, useRef } from 'react'
import { useAxios } from '../hooks/useAxios'
import { User, Task, PaginatedResponse } from '../types'
import { clientApi } from '../api/clientApi'

type Props = {
  user: User
}

export function UserTasks({ user }: Props) {
  const [filter, setFilter] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const responseCountRef = useRef<number>(0)

  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(
    `/users/${user.id}/tasks?page=1&limit=20`
  )

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (data) {
      responseCountRef.current += 1
    }
  }, [data])

  useEffect(() => {
    if (data) {
      document.title = `${user.name} · ${data.data.length} tasks`
    }
    return () => {
      document.title = 'Gerenciador de Tasks'
    }
  }, [user.name, data])

  const handleToggleTask = async (task: Task) => {
    setIsSaving(true)
    setSaveError(null)

    try {
      await clientApi.put(`/users/${user.id}/tasks/${task.id}`, {
        is_done: !task.is_done
      })
      refetch()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClear = () => {
    setFilter('')
    inputRef.current?.focus()
  }

  const handleShowCount = () => {
    console.log(`Total de respostas recebidas: ${responseCountRef.current}`)
  }

  if (isLoading) {
    return <div>Carregando...</div>
  }

  if (error) {
    return (
      <div>
        <p>Erro: {error}</p>
        <button type="button" onClick={refetch}>
          Tentar de novo
        </button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const filteredTasks = data.data.filter((task) =>
    task.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div>
      <h2>Tasks de {user.name}</h2>
      <div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Filtrar por nome..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button type="button" onClick={handleClear}>
          Limpar
        </button>
        <button type="button" onClick={handleShowCount}>
          Mostrar contador
        </button>
      </div>

      {isSaving && <p>Salvando...</p>}
      {saveError && <p style={{ color: 'red' }}>Erro: {saveError}</p>}

      <ul>
        {filteredTasks.map((task) => (
          <li key={task.id}>
            <button type="button" onClick={() => handleToggleTask(task)}>
              {task.is_done ? '✓' : '○'} {task.name}
            </button>
          </li>
        ))}
      </ul>
      {filteredTasks.length === 0 && <p>Nenhuma task encontrada</p>}
    </div>
  )
}
