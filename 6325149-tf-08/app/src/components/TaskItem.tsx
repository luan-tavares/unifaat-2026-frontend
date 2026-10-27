import type { Task } from "../types"

type Props = {
  task: Task
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export function TaskItem({ task, onToggle, onDelete }: Props) {
  const handleToggle = () => {
    onToggle(task.id)
  }

  const handleDelete = () => {
    onDelete(task.id)
  }

  return (
    <li className={task.isDone ? "item item--done" : "item"}>
      <span className="item__name" onClick={handleToggle}>
        {task.name}
      </span>
      <button className="item__delete" onClick={handleDelete}>
        Excluir
      </button>
    </li>
  )
}
