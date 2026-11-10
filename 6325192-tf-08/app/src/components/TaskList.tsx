import { TaskItem } from './TaskItem'
import type { Task } from '../types'

type Props = {
  tasks: Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskList({ tasks, onToggle, onDelete }: Props) {
  if (tasks.length === 0) {
    return <p className="empty">Nenhuma task</p>
  }

  return (
    <ul className="tasks">
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  )
}
