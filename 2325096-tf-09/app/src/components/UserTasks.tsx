import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'
import clientApi from '../api/clientApi'
import useAxios from '../hooks/useAxios'
import type { PaginatedResponse, Task, User } from '../types'

type Props = {
  user: User | null
  onTasksLoaded: (
    userId: number,
    response: PaginatedResponse<Task>,
  ) => void
}

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message
  return 'Não foi possível salvar a tarefa.'
}

function UserTasks({ user, onTasksLoaded }: Props) {
  const [filter, setFilter] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const filterRef = useRef<HTMLInputElement>(null)
  const tasksUrl =
    user === null ? null : `/users/${user.id}/tasks?page=1&limit=20`
  const { data, error, isLoading, refetch } =
    useAxios<PaginatedResponse<Task>>(tasksUrl)

  useEffect(() => {
    filterRef.current?.focus()
  }, [])

  useEffect(() => {
    if (user === null || data === null) return
    onTasksLoaded(user.id, data)
  }, [data, onTasksLoaded, user])

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilter(event.currentTarget.value)
  }

  const handleClearFilter = () => {
    setFilter('')
    filterRef.current?.focus()
  }

  const handleToggleTask = async (event: MouseEvent<HTMLButtonElement>) => {
    if (user === null || data === null) return

    const taskId = Number(event.currentTarget.dataset.taskId)
    if (!Number.isInteger(taskId)) return

    const task = data.data.find((item) => item.id === taskId)
    if (task === undefined) return

    setIsSaving(true)
    setSaveError(null)

    try {
      await clientApi.put(`/users/${user.id}/tasks/${task.id}`, {
        is_done: !task.is_done,
      })
      refetch()
    } catch (requestError: unknown) {
      setSaveError(getErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  const handleRetry = () => {
    refetch()
  }

  if (user === null) {
    return (
      <section className="panel tasks-panel empty-selection">
        <div className="empty-icon" aria-hidden="true">
          ✓
        </div>
        <h2>Escolha um usuário</h2>
        <p>As tarefas da pessoa selecionada aparecerão aqui.</p>
      </section>
    )
  }

  const normalizedFilter = filter.trim().toLocaleLowerCase()
  const visibleTasks =
    data?.data.filter((task) =>
      task.name.toLocaleLowerCase().includes(normalizedFilter),
    ) ?? []

  return (
    <section className="panel tasks-panel" aria-labelledby="tasks-heading">
      <div className="panel-heading tasks-heading">
        <div>
          <p className="eyebrow">TAREFAS DE</p>
          <h2 id="tasks-heading">{user.name}</h2>
          <p className="user-email">{user.email}</p>
        </div>
        {data !== null && (
          <span className="result-count">{data.total} tarefas</span>
        )}
      </div>

      <div className="filter-row">
        <label className="filter-input">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            ref={filterRef}
            type="search"
            value={filter}
            onChange={handleFilterChange}
            placeholder="Filtrar tarefas pelo nome"
            aria-label="Filtrar tarefas pelo nome"
          />
        </label>
        <button
          className="secondary-button"
          type="button"
          onClick={handleClearFilter}
          disabled={filter.length === 0}
        >
          Limpar
        </button>
      </div>

      {isSaving && <p className="saving-message">Salvando...</p>}
      {saveError !== null && (
        <p className="error-message" role="alert">
          Não foi possível salvar a tarefa: {saveError}
        </p>
      )}
      {isLoading && <p className="status-message">Carregando...</p>}

      {!isLoading && error !== null && (
        <div className="error-box" role="alert">
          <p>Não foi possível carregar as tarefas: {error}</p>
          <button className="secondary-button" type="button" onClick={handleRetry}>
            Tentar de novo
          </button>
        </div>
      )}

      {!isLoading && error === null && data !== null && (
        <>
          {data.data.length === 0 ? (
            <p className="status-message">Este usuário ainda não tem tarefas.</p>
          ) : visibleTasks.length === 0 ? (
            <p className="status-message">
              Nenhuma tarefa corresponde ao filtro.
            </p>
          ) : (
            <ul className="task-list">
              {visibleTasks.map((task) => (
                <li key={task.id}>
                  <button
                    className={`task-option${task.is_done ? ' is-done' : ''}`}
                    type="button"
                    data-task-id={task.id}
                    onClick={handleToggleTask}
                    disabled={isSaving}
                    aria-pressed={task.is_done}
                  >
                    <span className="task-check" aria-hidden="true">
                      {task.is_done ? '✓' : ''}
                    </span>
                    <span>{task.name}</span>
                    <span className="task-status">
                      {task.is_done ? 'Concluída' : 'Pendente'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

export default UserTasks
