
import type { Task } from "./types";

type Props = {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
};

function TaskItem({ task, onToggle, onDelete }: Props) {
  const handleToggle = () => {
    onToggle(task.id);
  };

  const handleDelete = () => {
    onDelete(task.id);
  };

  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={task.isDone}
          onChange={handleToggle}
        />

        <span
          style={{
            textDecoration: task.isDone ? "line-through" : "none",
          }}
        >
          {task.name}
        </span>
      </label>

      <button type="button" onClick={handleDelete}>
        Excluir
      </button>
    </li>
  );
}

export default TaskItem;
