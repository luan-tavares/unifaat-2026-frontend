import TaskItem from './TaskItem'
import type { Task } from '../types'

type Props = {
  tasks: Task[]
  onToggleTask: (taskId: string) => void
  onDeleteTask: (taskId: string) => void
}

function TaskList({ tasks, onToggleTask, onDeleteTask }: Props) {
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

export default TaskList
