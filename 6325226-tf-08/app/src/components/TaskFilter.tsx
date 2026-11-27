import type { Filter } from "../types/task"

type Props = {
    filter: Filter
    onChange: (filter: Filter) => void
}

export function TaskFilter({ filter, onChange }: Props) {
    function handleAll() {
        onChange("all")
    }

    function handlePending() {
        onChange("pending")
    }

    function handleDone() {
        onChange("done")
    }

    return (
        <div className="task-filter">
            <button type="button" aria-pressed={filter === "all"} onClick={handleAll}>Todas</button>
            <button type="button" aria-pressed={filter === "pending"} onClick={handlePending}>Pendentes</button>
            <button type="button" aria-pressed={filter === "done"} onClick={handleDone}>Feitas</button>
        </div>
    )
}
