import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'
import axios from 'axios'
import clientApi from '../api/clientApi'
import useAxios from '../hooks/useAxios'
import type { User, Task, PaginatedResponse } from '../types'

interface Props {
  user: User
}

function UserTasks({ user }: Props) {
  const [filter, setFilter] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const filterRef = useRef<HTMLInputElement>(null)
  const responsesRef = useRef(0)

  const { data, error, isLoading, refetch } =
    useAxios<PaginatedResponse<Task>>(
      `/users/${user.id}/tasks?page=1&limit=20`
    )

  useEffect(() => {
    filterRef.current?.focus()
  }, [])

  useEffect(() => {
    if (data) {
      responsesRef.current += 1
    }
  }, [data])

  useEffect(() => {
    document.title = data
      ? `${user.name} · ${data.total} tasks`
      : `${user.name} · Tarefas`
  }, [user.name, data])

  function handleFilter(event: ChangeEvent<HTMLInputElement>) {
    setFilter(event.target.value)
  }

  function handleClear() {
    setFilter('')
    filterRef.current?.focus()
  }

  function handleShowResponses() {
    console.log('Respostas de tarefas recebidas:', responsesRef.current)
  }

  async function handleToggleTask(event: MouseEvent<HTMLButtonElement>) {
    const taskId = Number(event.currentTarget.dataset.taskId)
    const task = data?.data.find((item) => item.id === taskId)

    if (!task) return

    setIsSaving(true)
    setSaveError(null)

    try {
      await clientApi.put(
        `/users/${user.id}/tasks/${task.id}`,
        { is_done: !task.is_done }
      )

      refetch()
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setSaveError(err.message)
      } else {
        setSaveError('Não foi possível salvar a tarefa.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const filteredTasks = data?.data.filter((task) =>
    task.name.toLowerCase().includes(filter.toLowerCase())
  ) ?? []

  if (isLoading) return <p>Carregando tarefas...</p>

  if (error) {
    return (
      <div>
        <p>Erro ao carregar tarefas: {error}</p>
        <button onClick={refetch}>Tentar de novo</button>
      </div>
    )
  }

  if (!data) return <p>Nenhuma tarefa encontrada.</p>

  return (
    <section>
      <h2>Tarefas de {user.name}</h2>

      <input
        ref={filterRef}
        type="text"
        placeholder="Filtrar tarefas pelo nome"
        value={filter}
        onChange={handleFilter}
      />

      <button onClick={handleClear}>Limpar</button>
      <button onClick={handleShowResponses}>Mostrar</button>

      {saveError && <p>Erro ao salvar: {saveError}</p>}
      {isSaving && <p>Salvando...</p>}

      <p>Total de tarefas: {data.total}</p>

      {filteredTasks.map((task) => (
        <button
          key={task.id}
          data-task-id={task.id}
          onClick={handleToggleTask}
          disabled={isSaving}
          className={task.is_done ? 'completed' : ''}
        >
          {task.is_done ? '✅' : '⬜'} {task.name}
        </button>
      ))}

      {filteredTasks.length === 0 && <p>Nenhuma tarefa encontrada.</p>}
    </section>
  )
}

export default UserTasks
