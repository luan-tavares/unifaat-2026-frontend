import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { isAxiosError } from 'axios'
import { clientApi } from '../api/clientApi'
import { useAxios } from '../hooks/useAxios'
import type { PaginatedResponse, Task, User } from '../types'

type Props = { user: User }
type TaskButtonProps = { task: Task; isSaving: boolean; onToggle: (task: Task) => void }

function TaskButton({ task, isSaving, onToggle }: TaskButtonProps) {
  function handleToggle() { onToggle(task) }
  return <li><button disabled={isSaving} className={task.is_done ? 'done' : ''} onClick={handleToggle}>
    <span>{task.is_done ? '✓' : '○'}</span><span>{task.name}</span>
  </button></li>
}

export function UserTasks({ user }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const receivedCountRef = useRef(0)
  const [filter, setFilter] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const url = `/users/${user.id}/tasks?page=1&limit=20`
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(url)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    if (data === null) return
    receivedCountRef.current += 1
  }, [data])
  useEffect(() => {
    document.title = `${user.name} · ${data?.total ?? 0} tasks`
    return () => { document.title = 'TF09 - Usuarios e Tasks' }
  }, [user.name, data?.total])

  function handleFilter(event: ChangeEvent<HTMLInputElement>) { setFilter(event.target.value) }
  function handleClear() { setFilter(''); inputRef.current?.focus() }
  function handleShowCount() { console.log('Respostas de tasks recebidas:', receivedCountRef.current) }
  async function handleToggle(task: Task) {
    if (isSaving) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await clientApi.put(`/users/${user.id}/tasks/${task.id}`, { is_done: !task.is_done })
      refetch()
    } catch (err: unknown) {
      const message = isAxiosError(err) ? err.message : 'Não foi possível salvar a task'
      setSaveError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredTasks = data?.data.filter(task => task.name.toLocaleLowerCase('pt-BR').includes(filter.toLocaleLowerCase('pt-BR'))) ?? []
  return <section className="panel">
    <h2>Tasks de {user.name}</h2><p className="muted">{user.email}</p>
    <div className="filter"><input ref={inputRef} value={filter} onChange={handleFilter} placeholder="Filtrar tasks por nome" aria-label="Filtrar tasks por nome" />
      <button onClick={handleClear}>Limpar</button></div>
    <button className="secondary" onClick={handleShowCount}>Mostrar respostas no console</button>
    {isLoading && <p>Carregando...</p>}
    {error && <div role="alert"><p>{error}</p><button onClick={refetch}>Tentar de novo</button></div>}
    {saveError && <p role="alert">{saveError}</p>}
    {isSaving && <p>Salvando...</p>}
    {data && !isLoading && <>
      <p className="muted">{data.total} task(s) encontradas</p>
      {filteredTasks.length === 0 && <p>Nenhuma task encontrada.</p>}
      <ul className="tasks">{filteredTasks.map(task => <TaskButton key={task.id} task={task} isSaving={isSaving} onToggle={handleToggle} />)}</ul>
    </>}
  </section>
}
