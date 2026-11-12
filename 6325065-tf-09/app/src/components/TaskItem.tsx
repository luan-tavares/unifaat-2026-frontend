import { useState } from "react"
import { isAxiosError } from "axios"
import type { Task } from "../types"
import { clientApi } from "../api/clientApi"

type Props = {
    userId: number
    task: Task
    onSaved: () => void
}

export function TaskItem({ userId, task, onSaved }: Props) {
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [saveError, setSaveError] = useState<string | null>(null)

    const handleToggle = async () => {
        setIsSaving(true)
        setSaveError(null)

        try {
            await clientApi.put<Task>(`/users/${userId}/tasks/${task.id}`, {
                is_done: !task.is_done,
            })
            setIsSaving(false)
            onSaved()
        } catch (err) {
            const message = isAxiosError(err) ? err.message : "Erro inesperado"
            setSaveError(message)
            setIsSaving(false)
        }
    }

    return (
        <li>
            <button type="button" onClick={handleToggle} disabled={isSaving}>
                {task.is_done ? "✅" : "⬜"} {task.name}
            </button>
            {isSaving && <small> Salvando...</small>}
            {saveError !== null && <small> Erro ao salvar: {saveError}</small>}
        </li>
    )
}
