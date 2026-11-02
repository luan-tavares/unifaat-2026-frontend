import { useState } from "react";
import type { Filter, Task } from "./types";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";

function filterTasks(tasks: Task[], filter: Filter): Task[] {
  if (filter === "pending") return tasks.filter((task) => !task.isDone);
  if (filter === "done") return tasks.filter((task) => task.isDone);
  return tasks;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  function handleAdd(name: string) {
    const newTask: Task = { id: crypto.randomUUID(), name, isDone: false };
    setTasks((current) => [...current, newTask]);
  }

  function handleToggle(id: string) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, isDone: !task.isDone } : task))
    );
  }

  function handleDelete(id: string) {
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  function handleShowAll() {
    setFilter("all");
  }

  function handleShowPending() {
    setFilter("pending");
  }

  function handleShowDone() {
    setFilter("done");
  }

  const pendingCount = tasks.filter((task) => !task.isDone).length;
  const visibleTasks = filterTasks(tasks, filter);

  return (
    <main>
      <h1>Tasks</h1>
      <TaskForm onAdd={handleAdd} />
      <div>
        <button type="button" onClick={handleShowAll}>Todas</button>
        <button type="button" onClick={handleShowPending}>Pendentes</button>
        <button type="button" onClick={handleShowDone}>Feitas</button>
      </div>
      <p>{pendingCount} pendente(s)</p>
      <TaskList tasks={visibleTasks} onToggle={handleToggle} onDelete={handleDelete} />
    </main>
  );
}

export default App;