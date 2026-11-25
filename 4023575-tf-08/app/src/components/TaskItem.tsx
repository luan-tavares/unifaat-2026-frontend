import type { Task } from '../App'

type Props = {
  task: Task
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

function TaskItem({ task, onToggle, onDelete }: Props) {
  function handleToggle() {
    onToggle(task.id)
  }

  function handleDelete() {
    onDelete(task.id)
  }

  return (
    <li className={`task-item${task.isDone ? ' done' : ''}`}>
      <span className="task-name" onClick={handleToggle}>
        {task.name}
      </span>
      <button className="delete" onClick={handleDelete} aria-label="Excluir">
        ✕
      </button>
    </li>
  )
}

export default TaskItem
