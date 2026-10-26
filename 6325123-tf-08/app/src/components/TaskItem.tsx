type Task = {
  id: string
  name: string
  isDone: boolean
}

type Props = {
  task: Task
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
}

export function TaskItem({ task, onToggleTask, onDeleteTask }: Props) {
  const handleToggle = () => onToggleTask(task.id)
  const handleDelete = () => onDeleteTask(task.id)

  return (
    <li className={task.isDone ? 'task-item is-done' : 'task-item'}>
      <label className="task-label">
        <input
          type="checkbox"
          checked={task.isDone}
          onChange={handleToggle}
        />
        <span className="task-name">{task.name}</span>
      </label>
      <button
        className="delete-button"
        type="button"
        onClick={handleDelete}
        aria-label={`Excluir ${task.name}`}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 6h12M8 6V4h4v2m2 0-.7 10H6.7L6 6m2.5 3v4m3-4v4" />
        </svg>
      </button>
    </li>
  )
}
