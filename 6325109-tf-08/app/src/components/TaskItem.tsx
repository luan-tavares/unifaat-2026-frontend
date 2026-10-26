import type { Task } from "../types";

type Props = {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

function TaskItem({ task, onToggle, onDelete }: Props) {
  const handleToggle = () => {
    onToggle(task.id);
  };

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onDelete(task.id);
  };

  const className = task.isDone ? "task-item is-done" : "task-item";

  return (
    <li className={className} onClick={handleToggle}>
      <span className="task-name">{task.name}</span>
      <button type="button" className="btn-delete" onClick={handleDelete}>
        Excluir
      </button>
    </li>
  );
}

export default TaskItem;
