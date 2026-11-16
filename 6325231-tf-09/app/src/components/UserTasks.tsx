import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import clientApi from '../api/clientApi'
import { useAxios } from '../hooks/useAxios'
import TaskItem from './TaskItem'
import type { PaginatedResponse, Task, User } from '../types'

type Props = {
  user: User
}

const DEFAULT_TITLE = 'TF09 · Usuários e tasks'

export default function UserTasks({ user }: Props) {
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(
    `/users/${user.id}/tasks?page=1&limit=20`
  )
  const [filter, setFilter] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const filterRef = useRef<HTMLInputElement>(null)
  const responsesRef = useRef(0)

  useEffect(() => {
    filterRef.current?.focus()
  }, [])

  useEffect(() => {
    if (data === null) return
    responsesRef.current += 1
  }, [data])

  const taskCount = data === null ? 0 : data.data.length

  useEffect(() => {
    document.title = `${user.name} · ${taskCount} tasks`

    return () => {
      document.title = DEFAULT_TITLE
    }
  }, [user.name, taskCount])

  function handleFilterChange(event: ChangeEvent<HTMLInputElement>) {
    setFilter(event.target.value)
  }

  function handleClear() {
    setFilter('')
    filterRef.current?.focus()
  }

  function handleShow() {
    console.log(`Respostas de tasks recebidas: ${responsesRef.current}`)
  }

  function handleRetry() {
    refetch()
  }

  async function handleToggle(task: Task) {
    setIsSaving(true)
    setSaveError('')

    try {
      await clientApi.put<Task>(`/users/${user.id}/tasks/${task.id}`, { is_done: !task.is_done })
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar a task'
      setSaveError(message)
    }

    setIsSaving(false)
  }

  const search = filter.trim().toLowerCase()
  const visibleTasks = data === null ? [] : data.data.filter(task => task.name.toLowerCase().includes(search))

  return (
    <>
      <h2>Tasks de {user.name}</h2>

      <div className="filter">
        <input
          ref={filterRef}
          type="text"
          value={filter}
          onChange={handleFilterChange}
          placeholder="Filtrar tasks por nome"
          aria-label="Filtrar tasks por nome"
        />
        <button type="button" onClick={handleClear}>Limpar</button>
        <button type="button" onClick={handleShow}>Mostrar</button>
      </div>

      {isSaving && <p className="muted">Salvando...</p>}
      {saveError !== '' && <p className="error">{saveError}</p>}

      {isLoading && <p className="muted">Carregando...</p>}

      {!isLoading && error !== '' && (
        <div className="error">
          <span>{error}</span>
          <button type="button" onClick={handleRetry}>Tentar de novo</button>
        </div>
      )}

      {!isLoading && error === '' && data !== null && (
        <ul className="list">
          {visibleTasks.length === 0 && <li className="muted">Nenhuma task.</li>}
          {visibleTasks.map(task => (
            <TaskItem key={task.id} task={task} isSaving={isSaving} onToggle={handleToggle} />
          ))}
        </ul>
      )}
    </>
  )
}
