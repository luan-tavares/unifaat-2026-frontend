import { useState } from "react"
import type { Filter, Task } from "./types/task"
import { TaskForm } from "./components/TaskForm"
import { TaskList } from "./components/TaskList"
import { FilterButton } from "./components/FilterButton"

const FILTERS: { filter: Filter, label: string }[] = [
    { filter: "all", label: "Todas" },
    { filter: "pending", label: "Pendentes" },
    { filter: "done", label: "Feitas" },
]

function filterTasks(tasks: Task[], filter: Filter): Task[] {
    if (filter === "pending") {
        return tasks.filter(task => !task.isDone)
    }
    if (filter === "done") {
        return tasks.filter(task => task.isDone)
    }
    return tasks
}

export function App() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [filter, setFilter] = useState<Filter>("all")

    const pendingCount = tasks.filter(task => !task.isDone).length
    const visibleTasks = filterTasks(tasks, filter)

    function handleAdd(name: string) {
        const newTask: Task = { id: Date.now(), name, isDone: false }
        setTasks(current => [...current, newTask])
    }

    function handleToggle(id: number) {
        setTasks(current => current.map(task => {
            if (task.id !== id) {
                return task
            }
            return { ...task, isDone: !task.isDone }
        }))
    }

    function handleDelete(id: number) {
        setTasks(current => current.filter(task => task.id !== id))
    }

    function handleFilter(newFilter: Filter) {
        setFilter(newFilter)
    }

    return (
        <main className="app">
            <h1>Tasks</h1>
            <TaskForm onAdd={handleAdd} />
            <nav className="filters">
                {FILTERS.map(item => (
                    <FilterButton
                        key={item.filter}
                        filter={item.filter}
                        label={item.label}
                        isActive={item.filter === filter}
                        onSelect={handleFilter}
                    />
                ))}
            </nav>
            <p className="counter">{pendingCount} pendente(s)</p>
            <TaskList tasks={visibleTasks} onToggle={handleToggle} onDelete={handleDelete} />
        </main>
    )
}
