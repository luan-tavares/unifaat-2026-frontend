import type { Task } from "../types/api"

type TaskItemProps = {
    task: Task
    isDisabled: boolean
    onToggle: (task: Task) => void
}

export function TaskItem({ task, isDisabled, onToggle }: TaskItemProps) {
    const className = task.is_done ? "task-item is-done" : "task-item"

    function handleToggle() {
        onToggle(task)
    }

    return (
        <li>
            <button className={className} onClick={handleToggle} disabled={isDisabled}>
                <span className="check">{task.is_done ? "✔" : ""}</span>
                {task.name}
            </button>
        </li>
    )
}
