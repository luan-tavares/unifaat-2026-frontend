import type { Task } from "../types";

type Props = {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

export function TaskItem({ task, onToggle, onDelete }: Props) {
  const handleToggle = () => {
    onToggle(task.id);
  };

  const handleDelete = () => {
    onDelete(task.id);
  };

  const nameClassName = task.isDone ? "task-name is-done" : "task-name";

  return (
    <li className="task-item">
      <span className={nameClassName} onClick={handleToggle}>
        {task.name}
      </span>
      <button type="button" className="delete" onClick={handleDelete}>
        Excluir
      </button>
    </li>
  );
}
