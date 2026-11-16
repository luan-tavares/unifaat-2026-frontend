
import { useEffect, useRef, useState } from 'react'
import clientApi from '../api/clientApi'
import useAxios from '../hooks/useAxios'
import type { User, Task, PaginatedResponse } from '../types'

type Props = {
  user: User
}

const UserTasks = ({ user }: Props): React.JSX.Element => {
  const filterInputRef = useRef<HTMLInputElement>(null)
  const responseCountRef = useRef(0)

  const [filter, setFilter] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const {
    data,
    error,
    isLoading,
    refetch,
  } = useAxios<PaginatedResponse<Task>>(
    `/users/${user.id}/tasks?page=1&limit=20`
  )

  useEffect(() => {
    filterInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (data !== null) {
      responseCountRef.current += 1
    }
  }, [data])

  useEffect(() => {
    const taskCount = data?.total ?? 0

    document.title = `${user.name} · ${taskCount} tasks`

    return () => {
      document.title = 'Usuários e Tasks'
    }
  }, [user.name, data])

  const handleFilterChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setFilter(event.target.value)
  }

  const handleClearFilter = (): void => {
    setFilter('')
    filterInputRef.current?.focus()
  }

  const handleShowResponseCount = (): void => {
    console.log(
      'Respostas de tasks recebidas:',
      responseCountRef.current
    )
  }

  const saveTask = async (task: Task): Promise<void> => {
    setIsSaving(true)
    setSaveError(null)

    try {
      await clientApi.put(
        `/users/${user.id}/tasks/${task.id}`,
        {
          is_done: !task.is_done,
        }
      )

      refetch()
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar a tarefa.'

      setSaveError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleTask = (task: Task): (() => void) => {
    return () => {
      void saveTask(task)
    }
  }

  if (isLoading) {
    return (
      <section>
        <h2>Tasks de {user.name}</h2>
        <p>Carregando...</p>
      </section>
    )
  }

  if (error !== null) {
    return (
      <section>
        <h2>Tasks de {user.name}</h2>
        <p>Erro: {error}</p>
        <button type="button" onClick={refetch}>
          Tentar de novo
        </button>
      </section>
    )
  }

  const filteredTasks =
    data?.data.filter((task) =>
      task.name.toLowerCase().includes(filter.toLowerCase())
    ) ?? []

  return (
    <section>
      <h2>Tasks de {user.name}</h2>

      <p>Email: {user.email}</p>
      <p>Total de tasks: {data?.total ?? 0}</p>

      <label htmlFor="task-filter">
        Filtrar tasks por nome:
      </label>

      <input
        id="task-filter"
        ref={filterInputRef}
        type="text"
        value={filter}
        onChange={handleFilterChange}
        placeholder="Digite o nome da task"
      />

      <button type="button" onClick={handleClearFilter}>
        Limpar
      </button>

      <button
        type="button"
        onClick={handleShowResponseCount}
      >
        Mostrar
      </button>

      {isSaving && <p>Salvando...</p>}

      {saveError !== null && (
        <p role="alert">Erro ao salvar: {saveError}</p>
      )}

      {filteredTasks.length === 0 && (
        <p>Nenhuma task encontrada.</p>
      )}

      <ul>
        {filteredTasks.map((task) => (
          <li key={task.id}>
            <button
              type="button"
              onClick={handleToggleTask(task)}
              disabled={isSaving}
            >
              {task.is_done ? '✓' : '○'} {task.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default UserTasks
