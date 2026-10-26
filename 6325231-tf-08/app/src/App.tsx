import { useState } from 'react'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import type { Filter, Task } from './types'

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [name, setName] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const pendingCount = tasks.filter(task => !task.isDone).length
  const visibleTasks = tasks.filter(task => {
    if (filter === 'pending') return !task.isDone
    if (filter === 'done') return task.isDone
    return true
  })

  function handleNameChange(value: string) {
    setName(value)
  }

  function handleAdd() {
    const trimmedName = name.trim()
    if (trimmedName === '') return

    setTasks(current => [
      ...current,
      { id: Math.max(0, ...current.map(task => task.id)) + 1, name: trimmedName, isDone: false },
    ])
    setName('')
  }

  function handleToggle(id: number) {
    setTasks(current => current.map(task => {
      if (task.id !== id) return task
      return { ...task, isDone: !task.isDone }
    }))
  }

  function handleDelete(id: number) {
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

  return (
    <main className="app">
      <header>
        <p className="eyebrow">TF 08 · React</p>
        <h1>Minhas tasks</h1>
        <p>Organize o que precisa ser feito.</p>
      </header>

      <TaskForm name={name} onNameChange={handleNameChange} onAdd={handleAdd} />

      <section aria-label="Lista de tasks">
        <div className="list-header">
          <strong>{pendingCount} pendente(s)</strong>
          <div className="filters" role="group" aria-label="Filtrar tasks">
            <button type="button" className={filter === 'all' ? 'active' : ''} onClick={handleAll}>Todas</button>
            <button type="button" className={filter === 'pending' ? 'active' : ''} onClick={handlePending}>Pendentes</button>
            <button type="button" className={filter === 'done' ? 'active' : ''} onClick={handleDone}>Feitas</button>
          </div>
        </div>
        <TaskList tasks={visibleTasks} onToggle={handleToggle} onDelete={handleDelete} />
      </section>
    </main>
  )
}
