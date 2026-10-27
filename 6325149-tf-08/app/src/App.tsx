import { useState } from "react"
import { FilterButton } from "./components/FilterButton"
import { TaskForm } from "./components/TaskForm"
import { TaskList } from "./components/TaskList"
import type { Filter, Task } from "./types"

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendentes" },
  { value: "done", label: "Feitas" },
]

const matchesFilter = (task: Task, filter: Filter): boolean => {
  if (filter === "pending") return !task.isDone
  if (filter === "done") return task.isDone
  return true
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filter, setFilter] = useState<Filter>("all")
  const [nextId, setNextId] = useState<number>(1)

  const handleAdd = (name: string) => {
    setTasks((current) => [...current, { id: nextId, name, isDone: false }])
    setNextId((current) => current + 1)
  }

  const handleToggle = (id: number) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, isDone: !task.isDone } : task,
      ),
    )
  }

  const handleDelete = (id: number) => {
    setTasks((current) => current.filter((task) => task.id !== id))
  }

  const visibleTasks = tasks.filter((task) => matchesFilter(task, filter))
  const pendingCount = tasks.filter((task) => !task.isDone).length

  return (
    <main className="card">
      <h1>To-do</h1>
      <TaskForm onAdd={handleAdd} />
      <div className="filters">
        {FILTERS.map(({ value, label }) => (
          <FilterButton
            key={value}
            value={value}
            label={label}
            isActive={filter === value}
            onSelect={setFilter}
          />
        ))}
      </div>
      <p className="counter">{pendingCount} pendente(s)</p>
      <TaskList
        tasks={visibleTasks}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </main>
  )
}

export default App
