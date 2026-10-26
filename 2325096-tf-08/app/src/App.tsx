import { useState } from "react"
import TaskForm from "./components/TaskForm"
import TaskList from "./components/TaskList"
import type { Filter, Task } from "./types"
import "./App.css"

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [taskName, setTaskName] = useState<string>("")
  const [filter, setFilter] = useState<Filter>("all")

  function handleAddTask(name: string) {
    const newTask: Task = {
      id: Date.now(),
      name,
      isDone: false,
    }

    setTasks((currentTasks) => [...currentTasks, newTask])
    setTaskName("")
  }

  function handleToggleTask(id: number) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== id) {
          return task
        }

        return { ...task, isDone: !task.isDone }
      }),
    )
  }

  function handleDeleteTask(id: number) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== id),
    )
  }

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending") {
      return !task.isDone
    }

    if (filter === "done") {
      return task.isDone
    }

    return true
  })

  const pendingCount = tasks.filter((task) => !task.isDone).length

  return (
    <main className="app">
      <header className="app-header">
        <p className="eyebrow">ORGANIZAÇÃO PESSOAL</p>
        <h1>Minhas tarefas</h1>
        <p className="subtitle">
          Um passo de cada vez. Organize o que precisa ser feito.
        </p>
      </header>

      <section className="task-panel" aria-label="Gerenciador de tarefas">
        <TaskForm
          name={taskName}
          onNameChange={setTaskName}
          onAddTask={handleAddTask}
        />

        <div className="task-summary">
          <span>
            {pendingCount} {pendingCount === 1 ? "tarefa pendente" : "tarefas pendentes"}
          </span>
        </div>

        <div className="filter-group" aria-label="Filtrar tarefas">
          <button
            type="button"
            className={filter === "all" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
          >
            Todas
          </button>
          <button
            type="button"
            className={filter === "pending" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("pending")}
            aria-pressed={filter === "pending"}
          >
            Pendentes
          </button>
          <button
            type="button"
            className={filter === "done" ? "filter-button active" : "filter-button"}
            onClick={() => setFilter("done")}
            aria-pressed={filter === "done"}
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

      <footer className="app-footer">
        Feito para manter o foco no que importa.
      </footer>
    </main>
  )
}

export default App
