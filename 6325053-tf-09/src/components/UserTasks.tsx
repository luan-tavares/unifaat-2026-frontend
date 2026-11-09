import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'
import axios from 'axios'
import { clientApi } from '../api/clientApi'
import { useAxios } from '../hooks/useAxios'
import type { PaginatedResponse, Task, User } from '../types'

type Props = {
  user: User
  onTasksCountChange: (count: number) => void
}

export const UserTasks = ({ user, onTasksCountChange }: Props) => {
  const [filter, setFilter] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const filterInputRef = useRef<HTMLInputElement>(null)
  const taskResponsesCountRef = useRef(0)
  const { data, error, isLoading, refetch } =
    useAxios<PaginatedResponse<Task>>(`/users/${user.id}/tasks?page=1&limit=20`)

  useEffect(() => {
    filterInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (data !== null) {
      taskResponsesCountRef.current += 1
      onTasksCountChange(data.total)
    }
  }, [data, onTasksCountChange])

  useEffect(() => {
    onTasksCountChange(0)
  }, [user.id, onTasksCountChange])

  const filteredTasks = (data?.data ?? []).filter((task) =>
    task.name.toLocaleLowerCase().includes(filter.toLocaleLowerCase()),
  )

  function handleFilterChange(event: ChangeEvent<HTMLInputElement>): void {
    setFilter(event.target.value)
  }

  function handleClearFilter(): void {
    setFilter('')
    filterInputRef.current?.focus()
  }

  async function handleToggleTask(event: MouseEvent<HTMLButtonElement>): Promise<void> {
    const taskId = Number(event.currentTarget.dataset.taskId)
    const task = data?.data.find((currentTask) => currentTask.id === taskId)

    if (task === undefined) {
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      await clientApi.put(`/users/${user.id}/tasks/${task.id}`, {
        is_done: !task.is_done,
      })
      refetch()
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.message
        : 'Não foi possível salvar a tarefa.'
      setSaveError(message)
    } finally {
      setIsSaving(false)
    }
  }

  function handleShowResponseCount(): void {
    console.log(`Respostas de tasks recebidas: ${taskResponsesCountRef.current}`)
  }


  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">LISTA DE ATIVIDADES</p>
          <h2>Tarefas de {user.name}</h2>
        </div>
        <span className="count">{data?.total ?? 0} tarefas</span>
      </div>

      <div className="filter-row">
        <input
          ref={filterInputRef}
          type="text"
          value={filter}
          onChange={handleFilterChange}
          placeholder="Filtrar tarefas pelo nome..."
          aria-label="Filtrar tarefas pelo nome"
        />
        <button className="secondary-button" type="button" onClick={handleClearFilter}>
          Limpar
        </button>
      </div>

      {isLoading && <p className="status">Carregando tarefas...</p>}
      {error !== null && (
        <div className="status error">
          <p>Erro ao carregar tarefas: {error}</p>
          <button type="button" onClick={refetch}>Tentar de novo</button>
        </div>
      )}
      {data === null && !isLoading && error === null && (
        <p className="status">Aguardando tarefas...</p>
      )}

      {data !== null && (
        <>
          {saveError !== null && <p className="error-message">Erro ao salvar: {saveError}</p>}
          {isSaving && <p className="saving-message">Salvando...</p>}

          <ul className="task-list">
            {filteredTasks.map((task) => (
              <li key={task.id}>
                <button
                  className={`task-option${task.is_done ? ' completed' : ''}`}
                  type="button"
                  data-task-id={task.id}
                  onClick={handleToggleTask}
                  disabled={isSaving}
                >
                  <span className={`task-check${task.is_done ? ' checked' : ''}`}>
                    {task.is_done ? '✓' : ''}
                  </span>
                  <span>{task.name}</span>
                </button>
              </li>
            ))}
          </ul>

          {filteredTasks.length === 0 && (
            <p className="empty-state">Nenhuma tarefa encontrada para esse filtro.</p>
          )}

          <div className="task-footer">
            <span>{filteredTasks.length} de {data.total} tarefas exibidas</span>
            <button className="text-button" type="button" onClick={handleShowResponseCount}>
              Mostrar
            </button>
          </div>
        </>
      )}
    </section>
  )
}
