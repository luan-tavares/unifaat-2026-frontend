import { useState } from "react"
import type { Filter, Task } from "./types/task"
import { TaskForm } from "./components/TaskForm"
import { TaskFilter } from "./components/TaskFilter"
import { TaskList } from "./components/TaskList"

// Valor derivado: calculado a partir da lista a cada renderização, sem outro estado
function filterTasks(tasks: Task[], filter: Filter): Task[] {
    if (filter === "pending") return tasks.filter(task => !task.isDone)
    if (filter === "done") return tasks.filter(task => task.isDone)

    return tasks
}

export default function App() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [filter, setFilter] = useState<Filter>("all")

    const pending = tasks.filter(task => !task.isDone).length
    const visibleTasks = filterTasks(tasks, filter)

    function handleAdd(name: string) {
        const task: Task = { id: crypto.randomUUID(), name, isDone: false }
        setTasks(current => [...current, task])
    }

    function handleToggle(id: string) {
        setTasks(current => current.map(task => {
            if (task.id !== id) return task
            return { ...task, isDone: !task.isDone }
        }))
    }

    function handleDelete(id: string) {
        setTasks(current => current.filter(task => task.id !== id))
    }

    return (
        <main className="app">
            <h1>Tasks</h1>

            <TaskForm onAdd={handleAdd} />

            <div className="toolbar">
                <TaskFilter filter={filter} onChange={setFilter} />
                <span className="counter">{pending} pendente(s)</span>
            </div>

            <TaskList tasks={visibleTasks} onToggle={handleToggle} onDelete={handleDelete} />
        </main>
    )
}
