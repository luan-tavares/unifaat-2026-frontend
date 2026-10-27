import { useState } from "react";
import type { Task, Filter } from "./types";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";
import "./App.css";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [nextId, setNextId] = useState(1);

  const handleAdd = (name: string) => {
    const newTask: Task = {
      id: nextId,
      name,
      isDone: false,
    };
    setTasks((current) => [...current, newTask]);
    setNextId((current) => current + 1);
  };

  const handleToggle = (id: number) => {
    setTasks((current) =>
      current.map((task) => {
        if (task.id === id) {
          return { ...task, isDone: !task.isDone };
        }
        return task;
      })
    );
  };

  const handleDelete = (id: number) => {
    setTasks((current) => current.filter((task) => task.id !== id));
  };

  const handleFilterChange = (newFilter: Filter) => {
    setFilter(newFilter);
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
    <div className="app">
      <h1>Lista de Tasks</h1>

      <TaskForm onAdd={handleAdd} />

      <div className="filters">
        <button
          type="button"
          className={filter === "all" ? "active" : ""}
          onClick={() => handleFilterChange("all")}
        >
          Todas
        </button>
        <button
          type="button"
          className={filter === "pending" ? "active" : ""}
          onClick={() => handleFilterChange("pending")}
        >
          Pendentes
        </button>
        <button
          type="button"
          className={filter === "done" ? "active" : ""}
          onClick={() => handleFilterChange("done")}
        >
          Feitas
        </button>
      </div>

      <div className="counter">
        {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
      </div>

      <TaskList
        tasks={filteredTasks}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default App;
