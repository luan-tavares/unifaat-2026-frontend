import { useState } from 'react'
import { TaskForm } from './components/TaskForm'
import { TaskList } from './components/TaskList'
import './App.css'

type Task = {
  id: string
  name: string
  isDone: boolean
}

type Filter = 'all' | 'pending' | 'done'

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>('all')

  const pendingCount = tasks.filter((task) => !task.isDone).length
  const visibleTasks = tasks.filter((task) => {
    if (filter === 'pending') {
      return !task.isDone
    }
    if (filter === 'done') {
      return task.isDone
    }
    return true
  })

  const handleAddTask = (name: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      name,
      isDone: false,
    }

    setTasks((current) => [...current, newTask])
  }

  const handleToggleTask = (id: string) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, isDone: !task.isDone } : task,
      ),
    )
  }

  const handleDeleteTask = (id: string) => {
    setTasks((current) => current.filter((task) => task.id !== id))
  }

  const handleShowAll = () => setFilter('all')
  const handleShowPending = () => setFilter('pending')
  const handleShowDone = () => setFilter('done')

  return (
    <main className="page-shell">
      <section className="todo-card" aria-labelledby="page-title">
        <header className="page-header">
          <span className="eyebrow">ORGANIZE SEU DIA</span>
          <h1 id="page-title">Minhas tasks</h1>
          <p className="task-count">
            {pendingCount} pendente{pendingCount === 1 ? '' : 's'}
          </p>
        </header>

        <TaskForm onAddTask={handleAddTask} />

        <nav className="filters" aria-label="Filtrar tasks">
          <button
            className={filter === 'all' ? 'filter-button is-active' : 'filter-button'}
            type="button"
            onClick={handleShowAll}
            aria-pressed={filter === 'all'}
          >
            Todas
          </button>
          <button
            className={filter === 'pending' ? 'filter-button is-active' : 'filter-button'}
            type="button"
            onClick={handleShowPending}
            aria-pressed={filter === 'pending'}
          >
            Pendentes
          </button>
          <button
            className={filter === 'done' ? 'filter-button is-active' : 'filter-button'}
            type="button"
            onClick={handleShowDone}
            aria-pressed={filter === 'done'}
          >
            Feitas
          </button>
        </nav>

        <TaskList
          tasks={visibleTasks}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
        />
      </section>
      <footer className="page-footer">Pequenos passos também contam.</footer>
    </main>
  )
}

export default App
