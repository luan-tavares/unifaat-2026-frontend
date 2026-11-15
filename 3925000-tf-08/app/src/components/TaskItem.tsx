import type { Task } from '../types'

type Props = {
  task: Task
  onToggleTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

function TaskItem({ task, onToggleTask, onDeleteTask }: Props) {
  const handleToggle = () => {
    onToggleTask(task.id)
  }

  const handleDelete = () => {
    onDeleteTask(task.id)
  }

  return (
    <li className={task.isDone ? 'task-item completed' : 'task-item'}>
      <button
        className="task-toggle"
        type="button"
        onClick={handleToggle}
        aria-pressed={task.isDone}
        aria-label={task.isDone ? `Marcar ${task.name} como pendente` : `Marcar ${task.name} como feita`}
      >
        <span className="checkmark" aria-hidden="true">
          {task.isDone ? '✓' : ''}
        </span>
        <span className="task-name">{task.name}</span>
      </button>
      <button
        className="delete-button"
        type="button"
        onClick={handleDelete}
        aria-label={`Excluir ${task.name}`}
        title="Excluir task"
      >
        ×
      </button>
    </li>
  )
}

export default TaskItem
