import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"

type TaskFormProps = {
    onAdd: (name: string) => void
}

export function TaskForm({ onAdd }: TaskFormProps) {
    const [name, setName] = useState("")

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        setName(event.target.value)
    }

    function handleAdd(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const trimmedName = name.trim()
        if (trimmedName === "") {
            return
        }
        onAdd(trimmedName)
        setName("")
    }

    return (
        <form className="task-form" onSubmit={handleAdd}>
            <input
                type="text"
                placeholder="Nome da task"
                value={name}
                onChange={handleChange}
            />
            <button type="submit">Adicionar</button>
        </form>
    )
}
