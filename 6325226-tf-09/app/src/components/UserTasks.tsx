import { useEffect, useRef, useState } from "react"
import clientApi from "../api/clientApi"
import { useAxios } from "../hooks/useAxios"
import type { PaginatedResponse, Task, User } from "../types/api"
import { getErrorMessage } from "../utils/getErrorMessage"
import ErrorMessage from "./ErrorMessage"
import TaskFilter from "./TaskFilter"
import TaskItem from "./TaskItem"

type Props = {
    user: User
    onTasksReceived: () => void
}

const DEFAULT_TITLE = "TF-09 · Usuários e tasks"

export default function UserTasks({ user, onTasksReceived }: Props) {
    const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(
        `/users/${user.id}/tasks?page=1&limit=20`
    )
    const [filter, setFilter] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState("")
    const onTasksReceivedRef = useRef(onTasksReceived)

    // A ref sempre aponta para o callback mais recente (fora das dependências do efeito abaixo)
    useEffect(() => {
        onTasksReceivedRef.current = onTasksReceived
    })

    // Cada resposta de tasks que chega avisa o App (dono do contador de bastidor)
    useEffect(() => {
        if (data === null) return
        onTasksReceivedRef.current()
    }, [data])

    // Sincroniza o título da aba com o usuário escolhido e a quantidade de tasks
    useEffect(() => {
        const count = data === null ? "..." : String(data.total)
        document.title = `${user.name} · ${count} tasks`

        return () => {
            document.title = DEFAULT_TITLE
        }
    }, [user.name, data])

    async function handleToggle(task: Task) {
        setIsSaving(true)
        setSaveError("")

        try {
            await clientApi.put<Task>(`/users/${user.id}/tasks/${task.id}`, { is_done: !task.is_done })
            refetch()
        } catch (err) {
            setSaveError(getErrorMessage(err, "Erro ao salvar a task"))
        }

        setIsSaving(false)
    }

    const search = filter.trim().toLowerCase()
    const tasks = data === null ? [] : data.data
    const visibleTasks = tasks.filter(task => task.name.toLowerCase().includes(search))

    return (
        <section className="panel">
            <h2>
                <span className="kanji" aria-hidden="true">任務</span>
                Tasks de {user.name}
            </h2>

            <TaskFilter value={filter} onChange={setFilter} />

            {isSaving && <p className="info">Salvando...</p>}
            {saveError !== "" && <p className="error">{saveError}</p>}

            {isLoading && <p className="loading">Carregando...</p>}
            {!isLoading && error !== "" && <ErrorMessage message={error} onRetry={refetch} />}
            {!isLoading && error === "" && data !== null && (
                <ul className="task-list">
                    {visibleTasks.map(task => (
                        <TaskItem key={task.id} task={task} isDisabled={isSaving} onToggle={handleToggle} />
                    ))}
                    {visibleTasks.length === 0 && <li className="empty">Nenhuma task encontrada</li>}
                </ul>
            )}
        </section>
    )
}
