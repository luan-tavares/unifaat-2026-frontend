import type { Task } from "../types/api"

type Props = {
    task: Task
    isDisabled: boolean
    onToggle: (task: Task) => void
}

export default function TaskItem({ task, isDisabled, onToggle }: Props) {
    function handleToggle() {
        onToggle(task)
    }

    const className = task.is_done ? "task-item done" : "task-item"

    return (
        <li>
            <button type="button" className={className} onClick={handleToggle} disabled={isDisabled}>
                <span>{task.is_done ? "✔" : "○"}</span>
                {task.name}
            </button>
        </li>
    )
}
