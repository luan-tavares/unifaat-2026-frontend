import type { Task } from '../types'
import TaskItem from './TaskItem'

type Props = {
  tasks: Task[]
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export default function TaskList({ tasks, onToggle, onDelete }: Props) {
  if (tasks.length === 0) return <p className="empty">Nenhuma task</p>

  return (
    <ul className="task-list">
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  )
}
