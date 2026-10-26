import type { Task } from "../types/task"

type Props = {
    task: Task
    onToggle: (id: string) => void
    onDelete: (id: string) => void
}

export function TaskItem({ task, onToggle, onDelete }: Props) {
    const className = task.isDone ? "task-name is-done" : "task-name"

    function handleToggle() {
        onToggle(task.id)
    }

    function handleDelete() {
        onDelete(task.id)
    }

    return (
        <li className="task-item">
            <button type="button" className={className} onClick={handleToggle}>
                {task.name}
            </button>
            <button type="button" className="delete" onClick={handleDelete}>Excluir</button>
        </li>
    )
}
