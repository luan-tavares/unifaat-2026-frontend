import type { Task } from '../types'

type Props = {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskItem({ task, onToggle, onDelete }: Props) {
  function handleToggle() {
    onToggle(task.id)
  }

  function handleDelete() {
    onDelete(task.id)
  }

  return (
    <li className="item">
      <button type="button" className={task.isDone ? 'task done' : 'task'} onClick={handleToggle} aria-pressed={task.isDone}>
        <span aria-hidden="true">{task.isDone ? '✓' : '○'}</span>
        <span>{task.name}</span>
      </button>
      <button type="button" className="delete" onClick={handleDelete} aria-label={`Excluir ${task.name}`}>Excluir</button>
    </li>
  )
}
