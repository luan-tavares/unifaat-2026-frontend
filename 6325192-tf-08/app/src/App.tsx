import { useState } from 'react'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'
import type { Filter, Task } from './types'

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>('all')

  function handleAdd(name: string) {
    const task: Task = { id: crypto.randomUUID(), name, isDone: false }
    setTasks(current => [...current, task])
  }

  function handleToggle(id: string) {
    setTasks(current => current.map(task => (
      task.id === id ? { ...task, isDone: !task.isDone } : task
    )))
  }

  function handleDelete(id: string) {
    setTasks(current => current.filter(task => task.id !== id))
  }

  function handleAll() {
    setFilter('all')
  }

  function handlePending() {
    setFilter('pending')
  }

  function handleDone() {
    setFilter('done')
  }

  const pendingCount = tasks.filter(task => !task.isDone).length
  const visibleTasks = tasks.filter(task => (
    filter === 'all' || (filter === 'pending' && !task.isDone) || (filter === 'done' && task.isDone)
  ))

  return (
    <main className="container">
      <p className="eyebrow">UNIFAAT · Desenvolvimento Web · Aula 08</p>
      <h1>Minhas tasks</h1>
      <p className="subtitle">Lista de tarefas com estado local em React e TypeScript.</p>
      <section className="panel">
        <TaskForm onAdd={handleAdd} />
        <div className="toolbar">
          <strong>{pendingCount} pendente(s)</strong>
          <div className="filters" aria-label="Filtrar tarefas">
            <button type="button" onClick={handleAll} aria-pressed={filter === 'all'}>Todas</button>
            <button type="button" onClick={handlePending} aria-pressed={filter === 'pending'}>Pendentes</button>
            <button type="button" onClick={handleDone} aria-pressed={filter === 'done'}>Feitas</button>
          </div>
        </div>
        <TaskList tasks={visibleTasks} onToggle={handleToggle} onDelete={handleDelete} />
      </section>
    </main>
  )
}
