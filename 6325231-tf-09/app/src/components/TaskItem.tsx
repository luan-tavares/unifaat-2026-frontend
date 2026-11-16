import type { Task } from '../types'

type Props = {
  task: Task
  isSaving: boolean
  onToggle: (task: Task) => void
}

export default function TaskItem({ task, isSaving, onToggle }: Props) {
  function handleToggle() {
    onToggle(task)
  }

  return (
    <li>
      <button type="button" className={`task-item ${task.is_done ? 'done' : ''}`} onClick={handleToggle} disabled={isSaving}>
        <span className="task-check" aria-hidden="true">{task.is_done ? '✓' : ''}</span>
        <span>{task.name}</span>
      </button>
    </li>
  )
}
