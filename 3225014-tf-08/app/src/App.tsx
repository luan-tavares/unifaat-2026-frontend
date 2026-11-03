import { useState } from "react"
import type { Task, Filter } from "./types"
import { TaskForm } from "./components/TaskForm"
import { TaskList } from "./components/TaskList"

export function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>("all")

  function handleAdd(name: string) {
    setTasks(current => [
      ...current,
      { id: Date.now(), name, isDone: false },
    ])
  }

  function handleToggle(id: number) {
    setTasks(current =>
      current.map(task =>
        task.id === id ? { ...task, isDone: !task.isDone } : task
      )
    )
  }

  function handleDelete(id: number) {
    setTasks(current => current.filter(task => task.id !== id))
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === "pending") return !task.isDone
    if (filter === "done") return task.isDone
    return true
  })

  const pendingCount = tasks.filter(task => !task.isDone).length

  return (
    <div>
      <h1>Task Manager</h1>

      <TaskForm onAdd={handleAdd} />

      <p>{pendingCount} pendente(s)</p>

      <div>
        <button onClick={() => setFilter("all")}>Todas</button>
        <button onClick={() => setFilter("pending")}>Pendentes</button>
        <button onClick={() => setFilter("done")}>Feitas</button>
      </div>

      <TaskList
        tasks={filteredTasks}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </div>
  )
}
