import { useState } from "react";
import type { Filter, Task } from "./types/task.ts";
import TaskForm from "./components/TaskForm.tsx";
import FilterBar from "./components/FilterBar.tsx";
import TaskList from "./components/TaskList.tsx";
import "./App.css";

function filterTasks(tasks: Task[], filter: Filter): Task[] {
  if (filter === "pending") {
    return tasks.filter((task) => !task.isDone);
  }

  if (filter === "done") {
    return tasks.filter((task) => task.isDone);
  }

  return tasks;
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  // Valores derivados: calculados a partir do estado, sem criar outro estado
  const visibleTasks = filterTasks(tasks, filter);
  const pendingCount = tasks.filter((task) => !task.isDone).length;

  function handleAdd(name: string) {
    const newTask: Task = { id: crypto.randomUUID(), name, isDone: false };
    setTasks((current) => [...current, newTask]);
  }

  function handleToggle(id: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, isDone: !task.isDone } : task,
      ),
    );
  }

  function handleDelete(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  return (
    <main className="todo">
      <h1>Minhas tasks</h1>

      <TaskForm onAdd={handleAdd} />

      <div className="todo-toolbar">
        <FilterBar filter={filter} onChange={setFilter} />
        <span className="todo-counter">{pendingCount} pendente(s)</span>
      </div>

      <TaskList tasks={visibleTasks} onToggle={handleToggle} onDelete={handleDelete} />
    </main>
  );
}
