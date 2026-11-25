import { useState } from 'react'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'

export type Task = {
  id: number
  name: string
  isDone: boolean
}

export type Filter = 'all' | 'pending' | 'done'

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>('all')

  const pendingCount = tasks.filter((t) => !t.isDone).length

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.isDone
    if (filter === 'done') return t.isDone
    return true
  })

  function handleAdd(name: string) {
    setTasks((current) => [
      ...current,
      { id: Date.now(), name, isDone: false },
    ])
  }

  function handleToggle(id: number) {
    setTasks((current) =>
      current.map((t) =>
        t.id === id ? { ...t, isDone: !t.isDone } : t,
      ),
    )
  }

  function handleDelete(id: number) {
    setTasks((current) => current.filter((t) => t.id !== id))
  }

  function handleFilterAll() {
    setFilter('all')
  }

  function handleFilterPending() {
    setFilter('pending')
  }

  function handleFilterDone() {
    setFilter('done')
  }

  return (
    <main>
      <h1>To-Do Tasks</h1>
      <p className="counter">{pendingCount} pendente(s)</p>

      <TaskForm onAdd={handleAdd} />

      <div className="filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={handleFilterAll}
        >
          Todas
        </button>
        <button
          className={filter === 'pending' ? 'active' : ''}
          onClick={handleFilterPending}
        >
          Pendentes
        </button>
        <button
          className={filter === 'done' ? 'active' : ''}
          onClick={handleFilterDone}
        >
          Feitas
        </button>
      </div>

      <TaskList
        tasks={filteredTasks}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </main>
  )
}

export default App
