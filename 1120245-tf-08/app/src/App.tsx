import { useState } from "react"
import type { Task, Filter } from "./types"
import { TaskForm } from "./components/TaskForm"
import { TaskList } from "./components/TaskList"
import { FilterBar } from "./components/FilterBar"

export function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>("all")
  const [nextId, setNextId] = useState(1)

  const pendingCount = tasks.filter((task) => !task.isDone).length

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending") return !task.isDone
    if (filter === "done") return task.isDone
    return true
  })

  function handleAdd(name: string) {
    setTasks((current) => [...current, { id: nextId, name, isDone: false }])
    setNextId((current) => current + 1)
  }

  function handleToggle(id: number) {
    setTasks((current) =>
      current.map((task) => {
        if (task.id !== id) return task
        return { ...task, isDone: !task.isDone }
      })
    )
  }

  function handleDelete(id: number) {
    setTasks((current) => current.filter((task) => task.id !== id))
  }

  function handleFilter(newFilter: Filter) {
    setFilter(newFilter)
  }

  return (
    <div
      style={{
        maxWidth: "520px",
        margin: "40px auto",
        fontFamily: "sans-serif",
        padding: "0 16px",
      }}
    >
      <h1 style={{ fontSize: "22px", marginBottom: "8px" }}>Tasks</h1>
      <p style={{ color: "#555", marginBottom: "20px" }}>
        {pendingCount} pendente(s)
      </p>

      <TaskForm onAdd={handleAdd} />
      <FilterBar current={filter} onFilter={handleFilter} />
      <TaskList tasks={filteredTasks} onToggle={handleToggle} onDelete={handleDelete} />
    </div>
  )
}
