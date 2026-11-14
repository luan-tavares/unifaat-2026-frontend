import { useState, useEffect, useRef } from 'react'
import useAxios from '../hooks/useAxios'
import clientApi from '../api/clientApi'
import { User, Task, PaginatedResponse } from '../types'

type Props = {
  user: User
  onTasksLoaded: (total: number) => void
}

function UserTasks({ user, onTasksLoaded }: Props) {
  const url = `/users/${user.id}/tasks?page=1&limit=20`
  const { data, error, isLoading, refetch } =
    useAxios<PaginatedResponse<Task>>(url)

  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [filterText, setFilterText] = useState<string>('')

  const filterRef = useRef<HTMLInputElement>(null)
  const responseCountRef = useRef<number>(0)

  // Foco automático no campo de filtro ao montar
  useEffect(() => {
    filterRef.current?.focus()
  }, [])

  // Incrementa o contador de respostas (useRef, sem renderizar) e notifica o App
  useEffect(() => {
    if (!data) {
      return
    }
    responseCountRef.current += 1
    onTasksLoaded(data.total)
  }, [data, onTasksLoaded])

  const handleToggleTask = (task: Task) => {
    setIsSaving(true)
    setSaveError(null)

    const toggle = async () => {
      try {
        await clientApi.put(`/users/${user.id}/tasks/${task.id}`, {
          is_done: !task.is_done,
        })
        refetch()
      } catch {
        setSaveError('Erro ao salvar. Tente novamente.')
      } finally {
        setIsSaving(false)
      }
    }

    toggle()
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value)
  }

  const handleClearFilter = () => {
    setFilterText('')
    filterRef.current?.focus()
  }

  const handleShowCount = () => {
    console.log(`Respostas recebidas: ${responseCountRef.current}`)
    alert(`Respostas de tasks recebidas: ${responseCountRef.current}`)
  }

  if (isLoading) {
    return <p>Carregando...</p>
  }

  if (error) {
    return (
      <div>
        <p>Erro: {error}</p>
        <button onClick={refetch}>Tentar de novo</button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const filteredTasks = data.data.filter((task) =>
    task.name.toLowerCase().includes(filterText.toLowerCase()),
  )

  return (
    <div>
      <h2>Tasks de {user.name}</h2>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          ref={filterRef}
          type="text"
          placeholder="Filtrar tasks por nome..."
          value={filterText}
          onChange={handleFilterChange}
          style={{ flex: 1, padding: '6px' }}
        />
        <button onClick={handleClearFilter}>Limpar</button>
        <button onClick={handleShowCount}>Mostrar</button>
      </div>

      {isSaving && <p>Salvando...</p>}
      {saveError && <p style={{ color: 'red' }}>{saveError}</p>}

      <ul style={{ padding: 0 }}>
        {filteredTasks.map((task) => (
          <li
            key={task.id}
            onClick={() => handleToggleTask(task)}
            style={{
              cursor: 'pointer',
              listStyle: 'none',
              padding: '6px 10px',
              marginBottom: '4px',
              borderRadius: '4px',
              background: task.is_done ? '#d4edda' : '#fff3cd',
              textDecoration: task.is_done ? 'line-through' : 'none',
              opacity: isSaving ? 0.6 : 1,
            }}
          >
            {task.is_done ? '✅' : '⬜'} {task.name}
          </li>
        ))}
      </ul>

      {filteredTasks.length === 0 && (
        <p>Nenhuma task encontrada para "{filterText}".</p>
      )}
    </div>
  )
}

export default UserTasks
