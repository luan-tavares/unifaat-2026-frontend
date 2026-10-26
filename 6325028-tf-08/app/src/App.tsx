import { useState } from "react";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";
import "./App.css";

type Task = {
  id: number;
  name: string;
  isDone: boolean;
};

type Filter = "all" | "pending" | "done";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  const handleAdd = (name: string) => {
    const newTask: Task = {
      id: Date.now() + Math.random(),
      name,
      isDone: false,
    };

    setTasks((current) => [...current, newTask]);
  };

  const handleToggle = (id: number) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, isDone: !task.isDone }
          : task
      )
    );
  };

  const handleDelete = (id: number) => {
    setTasks((current) =>
      current.filter((task) => task.id !== id)
    );
  };

  const handleFilterAll = () => {
    setFilter("all");
  };

  const handleFilterPending = () => {
    setFilter("pending");
  };

  const handleFilterDone = () => {
    setFilter("done");
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

  const pendingCount = tasks.filter(
    (task) => !task.isDone
  ).length;

  return (
    <main>
      <h1>Gerenciador de Tarefas</h1>

      <TaskForm onAdd={handleAdd} />

      <div>
        <button type="button" onClick={handleFilterAll}>
          Todas
        </button>

        <button type="button" onClick={handleFilterPending}>
          Pendentes
        </button>

        <button type="button" onClick={handleFilterDone}>
          Feitas
        </button>
      </div>

      <p>{pendingCount} pendente(s)</p>

      <TaskList
        tasks={filteredTasks}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
    </main>
  );
}

export default App;