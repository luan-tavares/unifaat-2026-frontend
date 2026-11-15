import type { Task } from "../types/api"

type TaskItemProps = {
    task: Task
    onToggle: (task: Task) => void
    onDelete: (id: number) => void
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
    const decoration = task.is_done ? "line-through" : "none"

    return (
        <li className="list-group-item d-flex justify-content-between">
            <span style={{ textDecoration: decoration }} onClick={() => onToggle(task)}>
                {task.name}
            </span>
            <button className="btn btn-sm btn-danger" onClick={() => onDelete(task.id)}>
                Excluir
            </button>
        </li>
    )
}
