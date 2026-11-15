import { useState } from 'react'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import type { Filter, Task } from './types'

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>('all')

  const pendingCount = tasks.filter((task) => !task.isDone).length

  const filteredTasks = tasks.filter((task) => {
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

  const handleToggleTask = (taskId: string) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, isDone: !task.isDone } : task,
      ),
    )
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((current) => current.filter((task) => task.id !== taskId))
  }

  const handleFilterChange = (newFilter: Filter) => {
    setFilter(newFilter)
  }

  return (
    <main className="page">
      <section className="todo-card" aria-labelledby="page-title">
        <header className="header">
          <span className="eyebrow">ORGANIZAÇÃO PESSOAL</span>
          <h1 id="page-title">Minhas tasks</h1>
          <p className="subtitle">Um passo de cada vez. Organize seu dia.</p>
        </header>

        <TaskForm onAddTask={handleAddTask} />

        <section className="tasks-section" aria-label="Lista de tasks">
          <div className="list-heading">
            <h2>Suas atividades</h2>
            <span className="pending-count">
              {pendingCount} pendente(s)
            </span>
          </div>

          <div className="filters" aria-label="Filtrar tasks">
            <button
              className={filter === 'all' ? 'filter-button active' : 'filter-button'}
              type="button"
              onClick={() => handleFilterChange('all')}
              aria-pressed={filter === 'all'}
            >
              Todas
            </button>
            <button
              className={filter === 'pending' ? 'filter-button active' : 'filter-button'}
              type="button"
              onClick={() => handleFilterChange('pending')}
              aria-pressed={filter === 'pending'}
            >
              Pendentes
            </button>
            <button
              className={filter === 'done' ? 'filter-button active' : 'filter-button'}
              type="button"
              onClick={() => handleFilterChange('done')}
              aria-pressed={filter === 'done'}
            >
              Feitas
            </button>
          </div>

          <TaskList
            tasks={filteredTasks}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
        </section>

        <footer className="footer">TF-08 · React + TypeScript</footer>
      </section>
    </main>
  )
}

export default App
