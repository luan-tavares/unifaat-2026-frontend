
import { useState } from "react";
import type { Task, Filter } from "./types";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<Filter>("all");

  const pendingCount = tasks.filter((task) => !task.isDone).length;

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending") {
      return !task.isDone;
    }

    if (filter === "done") {
      return task.isDone;
    }

    return true;
  });

  const handleAddTask = (name: string) => {
    const trimmedName = name.trim();

    if (trimmedName === "") {
      return;
    }

    const newTask: Task = {
      id: Date.now(),
      name: trimmedName,
      isDone: false,
    };

    setTasks((current) => [...current, newTask]);
  };

  const handleToggleTask = (id: number) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id
          ? { ...task, isDone: !task.isDone }
          : task
      )
    );
  };

  const handleDeleteTask = (id: number) => {
    setTasks((current) =>
      current.filter((task) => task.id !== id)
    );
  };

  const handleShowAll = () => {
    setFilter("all");
  };

  const handleShowPending = () => {
    setFilter("pending");
  };

  const handleShowDone = () => {
    setFilter("done");
  };

  return (
    <main>
      <h1>Minha lista de tarefas</h1>

      <TaskForm onAddTask={handleAddTask} />

      <p>{pendingCount} pendente(s)</p>

      <div>
        <button type="button" onClick={handleShowAll}>
          Todas
        </button>

        <button type="button" onClick={handleShowPending}>
          Pendentes
        </button>

        <button type="button" onClick={handleShowDone}>
          Feitas
        </button>
      </div>

      <TaskList
        tasks={filteredTasks}
        onToggle={handleToggleTask}
        onDelete={handleDeleteTask}
      />
    </main>
  );
}

export default App;
