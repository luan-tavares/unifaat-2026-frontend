import { useState } from "react";
import type { Filter, Task } from "./types";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";

type FilterOption = {
  value: Filter;
  label: string;
};

const FILTER_OPTIONS: FilterOption[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendentes" },
  { value: "done", label: "Feitas" },
];

const filterTasks = (tasks: Task[], filter: Filter): Task[] => {
  const filters: Record<Filter, (task: Task) => boolean> = {
    all: () => true,
    pending: (task) => !task.isDone,
    done: (task) => task.isDone,
  };

  return tasks.filter(filters[filter]);
};

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nextId, setNextId] = useState<number>(1);
  const [filter, setFilter] = useState<Filter>("all");

  const visibleTasks = filterTasks(tasks, filter);
  const pendingCount = tasks.filter((task) => !task.isDone).length;

  const handleAdd = (name: string) => {
    const newTask: Task = { id: nextId, name, isDone: false };

    setTasks((previousTasks) => [...previousTasks, newTask]);
    setNextId((previousId) => previousId + 1);
  };

  const handleToggle = (id: number) => {
    setTasks((previousTasks) =>
      previousTasks.map((task) =>
        task.id === id ? { ...task, isDone: !task.isDone } : task,
      ),
    );
  };

  const handleDelete = (id: number) => {
    setTasks((previousTasks) => previousTasks.filter((task) => task.id !== id));
  };

  const handleFilterChange = (value: Filter) => {
    setFilter(value);
  };

  return (
    <main className="app">
      <h1>To-do</h1>
      <TaskForm onAdd={handleAdd} />
      <nav className="filters">
        {FILTER_OPTIONS.map((option) => {
          const isActive = option.value === filter;
          const handleClick = () => handleFilterChange(option.value);

          return (
            <button
              key={option.value}
              type="button"
              className={isActive ? "filter is-active" : "filter"}
              onClick={handleClick}
            >
              {option.label}
            </button>
          );
        })}
      </nav>
      <TaskList
        tasks={visibleTasks}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />
      <p className="counter">
        {pendingCount} {pendingCount === 1 ? "pendente" : "pendentes"}
      </p>
    </main>
  );
}
