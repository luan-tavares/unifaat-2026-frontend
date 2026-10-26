import { useState } from "react";
import type { Filter, Task } from "./types";
import TaskForm from "./components/TaskForm";
import TaskFilter from "./components/TaskFilter";
import TaskList from "./components/TaskList";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  const handleAdd = (name: string) => {
    const trimmed = name.trim();
    const isEmpty = trimmed.length === 0;

    if (isEmpty) {
      return;
    }

    setTasks((current) => {
      const ids = current.map((task) => task.id);
      const nextId = ids.length === 0 ? 1 : Math.max(...ids) + 1;
      const newTask: Task = { id: nextId, name: trimmed, isDone: false };
      return [...current, newTask];
    });
  };

  const handleToggle = (id: number) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, isDone: !task.isDone } : task
      )
    );
  };

  const handleDelete = (id: number) => {
    setTasks((current) => current.filter((task) => task.id !== id));
  };

  const handleFilterChange = (next: Filter) => {
    setFilter(next);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending") {
      return !task.isDone;
    }

    if (filter === "done") {
      return task.isDone;
    }

    return true;
  });

  const pendingCount = tasks.filter((task) => !task.isDone).length;

  return (
    <main className="app">
      <h1>To-do de Tasks</h1>

      <TaskForm onAdd={handleAdd} />

      <TaskFilter filter={filter} onChange={handleFilterChange} />

      <p className="counter">{pendingCount} pendente(s)</p>

      <TaskList
        tasks={filteredTasks}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </main>
  );
}

export default App;
