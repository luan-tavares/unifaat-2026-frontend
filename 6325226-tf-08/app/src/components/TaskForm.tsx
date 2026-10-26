import { useState } from "react"
import type { ChangeEvent } from "react"

type Props = {
    onAdd: (name: string) => void
}

export function TaskForm({ onAdd }: Props) {
    const [name, setName] = useState("")

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        setName(event.target.value)
    }

    function handleAdd() {
        const trimmed = name.trim()
        if (trimmed === "") return

        onAdd(trimmed)
        setName("")
    }

    return (
        <div className="task-form">
            <input
                value={name}
                onChange={handleChange}
                placeholder="Nova task"
                aria-label="Nome da task"
            />
            <button type="button" onClick={handleAdd}>Adicionar</button>
        </div>
    )
}
