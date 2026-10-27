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

  return (
    <li className={`task-item ${task.isDone ? "done" : ""}`}>
      <span onClick={handleToggle} className="task-name">
        {task.name}
      </span>
      <button type="button" onClick={handleDelete} className="delete-btn">
        Excluir
      </button>
    </li>
  );
}
