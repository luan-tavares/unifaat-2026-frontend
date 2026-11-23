import type { Task } from "../types/task"

type TaskItemProps = {
    task: Task
    onToggle: (id: number) => void
    onDelete: (id: number) => void
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
    const className = task.isDone ? "task-name is-done" : "task-name"

    function handleToggle() {
        onToggle(task.id)
    }

    function handleDelete() {
        onDelete(task.id)
    }

    return (
        <li className="task-item">
            <span className={className} onClick={handleToggle}>
                {task.name}
            </span>
            <button className="btn-delete" onClick={handleDelete}>Excluir</button>
        </li>
    )
}
