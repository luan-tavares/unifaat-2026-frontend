import type { Task } from "../types"

type Props = {
    task: Task
    onToggle: (task: Task) => void
}

export function TaskItem({ task, onToggle }: Props) {
    function handleToggle() {
        onToggle(task)
    }

    return (
        <li>
            <button className={task.is_done ? "task done" : "task"} onClick={handleToggle}>
                {task.is_done ? "✓" : "○"} {task.name}
            </button>
        </li>
    )
}
