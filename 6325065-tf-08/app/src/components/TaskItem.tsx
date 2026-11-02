import type { Task } from "../types";

type Props = {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export function TaskItem({ task, onToggle, onDelete }: Props) {
  function handleToggle() {
    onToggle(task.id);
  }

  function handleDelete() {
    onDelete(task.id);
  }

  const textDecoration = task.isDone ? "line-through" : "none";

  return (
    <li>
      <span onClick={handleToggle} style={{ textDecoration, cursor: "pointer" }}>
        {task.name}
      </span>
      <button type="button" onClick={handleDelete}>
        Excluir
      </button>
    </li>
  );
}