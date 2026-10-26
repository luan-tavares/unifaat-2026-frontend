import type { Task } from "../types"

type TaskItemProps = {
  task: Task
  onToggleTask: (id: number) => void
  onDeleteTask: (id: number) => void
}

function TaskItem({ task, onToggleTask, onDeleteTask }: TaskItemProps) {
  function handleToggle() {
    onToggleTask(task.id)
  }

  function handleDelete() {
    onDeleteTask(task.id)
  }

  return (
    <li>
      <label>
        <input
          type="checkbox"
          checked={task.isDone}
          onChange={handleToggle}
        />
        <span>{task.name}</span>
      </label>
      <button type="button" onClick={handleDelete}>
        Excluir
      </button>
    </li>
  )
}

export default TaskItem
