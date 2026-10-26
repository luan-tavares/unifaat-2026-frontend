import type { Task } from '../types'

type Props = {
  task: Task
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export default function TaskItem({ task, onToggle, onDelete }: Props) {
  function handleToggle() {
    onToggle(task.id)
  }

  function handleDelete() {
    onDelete(task.id)
  }

  return (
    <li className="task-item">
      <button
        type="button"
        className={`task-toggle ${task.isDone ? 'done' : ''}`}
        onClick={handleToggle}
        aria-pressed={task.isDone}
      >
        <span className="task-check" aria-hidden="true">{task.isDone ? '✓' : ''}</span>
        <span>{task.name}</span>
      </button>
      <button type="button" className="task-delete" onClick={handleDelete} aria-label={`Excluir ${task.name}`}>
        Excluir
      </button>
    </li>
  )
}
