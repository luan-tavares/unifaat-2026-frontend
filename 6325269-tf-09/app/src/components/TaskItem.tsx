import type { Task } from "../types/api.ts";

type Props = {
  task: Task;
  isDisabled: boolean;
  onToggle: (task: Task) => void;
};

export default function TaskItem({ task, isDisabled, onToggle }: Props) {
  function handleToggle() {
    onToggle(task);
  }

  return (
    <li>
      <button
        type="button"
        className={task.is_done ? "task task--done" : "task"}
        aria-pressed={task.is_done}
        disabled={isDisabled}
        onClick={handleToggle}
      >
        <span className="task-check" aria-hidden="true">
          {task.is_done ? "✓" : ""}
        </span>
        {task.name}
      </button>
    </li>
  );
}
