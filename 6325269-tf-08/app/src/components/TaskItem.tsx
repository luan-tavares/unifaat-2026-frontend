import type { Task } from "../types/task.ts";

type Props = {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function TaskItem({ task, onToggle, onDelete }: Props) {
  function handleToggle() {
    onToggle(task.id);
  }

  function handleDelete() {
    onDelete(task.id);
  }

  return (
    <li className={task.isDone ? "task-item is-done" : "task-item"}>
      <button type="button" className="task-name" onClick={handleToggle}>
        <span className="task-check">{task.isDone ? "✓" : ""}</span>
        {task.name}
      </button>
      <button type="button" className="task-delete" onClick={handleDelete}>
        Excluir
      </button>
    </li>
  );
}
