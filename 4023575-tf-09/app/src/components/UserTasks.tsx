import { useState, useEffect, useRef } from 'react'
import useAxios from '../hooks/useAxios'
import clientApi from '../api/clientApi'
import { User, Task, PaginatedResponse } from '../types'

type Props = {
  user: User
  onTaskCountChange: (total: number) => void
}

function UserTasks({ user, onTaskCountChange }: Props) {
  const [page, setPage] = useState<number>(1)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [filterText, setFilterText] = useState<string>('')

  const filterRef = useRef<HTMLInputElement>(null)
  const responseCountRef = useRef<number>(0)

  const url = `/users/${user.id}/tasks?page=${page}&limit=20`
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(url)

  // Foco automático no campo de filtro quando o componente monta
  useEffect(() => {
    filterRef.current?.focus()
  }, [])

  // Conta quantas respostas de tasks o app já recebeu e notifica o App do total
  useEffect(() => {
    if (data === null) {
      return
    }
    responseCountRef.current += 1
    onTaskCountChange(data.total)
  }, [data, onTaskCountChange])

  function handlePrev() {
    setPage((current) => current - 1)
  }

  function handleNext() {
    setPage((current) => current + 1)
  }

  function handleRetry() {
    refetch()
  }

  async function handleToggleTask(task: Task) {
    setIsSaving(true)
    setSaveError(null)

    try {
      await clientApi.put(`/users/${user.id}/tasks/${task.id}`, {
        is_done: !task.is_done,
      })
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar'
      setSaveError(message)
    } finally {
      setIsSaving(false)
    }
  }

  function handleFilterChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFilterText(event.target.value)
  }

  function handleClearFilter() {
    setFilterText('')
    filterRef.current?.focus()
  }

  function handleShowCount() {
    console.log(`Respostas recebidas: ${responseCountRef.current}`)
  }

  if (isLoading) {
    return <p>Carregando...</p>
  }

  if (error) {
    return (
      <div>
        <p>Erro: {error}</p>
        <button onClick={handleRetry}>Tentar de novo</button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const filteredTasks = data.data.filter((task) =>
    task.name.toLowerCase().includes(filterText.toLowerCase())
  )

  return (
    <div>
      <h2>Tasks de {user.name}</h2>

      <div>
        <input
          ref={filterRef}
          type="text"
          placeholder="Filtrar por nome"
          value={filterText}
          onChange={handleFilterChange}
        />
        <button onClick={handleClearFilter}>Limpar</button>
      </div>

      {isSaving && <p>Salvando...</p>}
      {saveError && <p>Erro ao salvar: {saveError}</p>}

      <ul>
        {filteredTasks.map((task) => (
          <li key={task.id}>
            <button onClick={() => handleToggleTask(task)} disabled={isSaving}>
              {task.is_done ? '✅' : '⬜'} {task.name}
            </button>
          </li>
        ))}
      </ul>

      <div>
        <button onClick={handlePrev} disabled={page === 1}>
          Anterior
        </button>
        <span> Página {page} </span>
        <button onClick={handleNext} disabled={data.next === null}>
          Próxima
        </button>
      </div>

      <button onClick={handleShowCount}>Mostrar</button>
    </div>
  )
}

export default UserTasks
