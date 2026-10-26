import { TaskItem } from './TaskItem'

type Task = {
  id: string
  name: string
  isDone: boolean
}

type Props = {
  tasks: Task[]
  onToggleTask: (id: string) => void
  onDeleteTask: (id: string) => void
}

export function TaskList({ tasks, onToggleTask, onDeleteTask }: Props) {
  if (tasks.length === 0) {
    return <p className="empty-state">Nenhuma task</p>
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleTask={onToggleTask}
          onDeleteTask={onDeleteTask}
        />
      ))}
    </ul>
  )
}
