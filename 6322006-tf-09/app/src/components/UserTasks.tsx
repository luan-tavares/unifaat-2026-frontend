import { useEffect, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import clientApi from "../api/clientApi"
import { useAxios } from "../hooks/useAxios"
import { getErrorMessage } from "../utils/getErrorMessage"
import { TaskItem } from "./TaskItem"
import type { PaginatedResponse, Task, User } from "../types/api"

export const DEFAULT_TITLE = "Usuários e Tasks"

type UserTasksProps = {
    user: User | null
    onTasksReceived: () => void
}

export function UserTasks({ user, onTasksReceived }: UserTasksProps) {
    // Sem usuário escolhido a url é null e o hook fica parado
    const url = user === null ? null : `/users/${user.id}/tasks?page=1&limit=20`
    const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(url)
    const [filter, setFilter] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState("")
    const filterRef = useRef<HTMLInputElement>(null)

    const userName = user === null ? "" : user.name
    const total = data === null ? 0 : data.total
    const term = filter.trim().toLowerCase()
    const visibleTasks = data === null
        ? []
        : data.data.filter(task => task.name.toLowerCase().includes(term))

    // Foco automático quando a tela monta
    useEffect(() => {
        filterRef.current?.focus()
    }, [])

    // Dado de bastidor: avisa o App a cada resposta de tasks que chega
    useEffect(() => {
        if (data === null) return
        onTasksReceived()
    }, [data, onTasksReceived])

    // Sincroniza o título da aba com o usuário escolhido
    useEffect(() => {
        if (userName === "") {
            document.title = DEFAULT_TITLE
            return
        }

        document.title = `${userName} · ${total} tasks`

        return () => {
            document.title = DEFAULT_TITLE
        }
    }, [userName, total])

    function handleFilterChange(event: ChangeEvent<HTMLInputElement>) {
        setFilter(event.target.value)
    }

    function handleClear() {
        setFilter("")
        filterRef.current?.focus()
    }

    function handleRetry() {
        refetch()
    }

    async function handleToggle(task: Task) {
        if (user === null) return

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

    if (user === null) {
        return (
            <section className="panel">
                <h2>Tasks</h2>
                <p className="muted">Escolha um usuário para ver as tasks.</p>
            </section>
        )
    }

    return (
        <section className="panel">
            <h2>Tasks de {user.name}</h2>

            <div className="filter">
                <input
                    ref={filterRef}
                    type="text"
                    placeholder="Filtrar por nome"
                    value={filter}
                    onChange={handleFilterChange}
                />
                <button onClick={handleClear}>Limpar</button>
            </div>

            {isSaving && <p className="muted">Salvando...</p>}
            {saveError !== "" && <p className="error">{saveError}</p>}

            {isLoading && <p className="muted">Carregando...</p>}

            {!isLoading && error !== "" && (
                <div className="error">
                    <p>{error}</p>
                    <button onClick={handleRetry}>Tentar de novo</button>
                </div>
            )}

            {!isLoading && error === "" && data !== null && visibleTasks.length === 0 && (
                <p className="muted">Nenhuma task</p>
            )}

            {!isLoading && error === "" && data !== null && visibleTasks.length > 0 && (
                <ul className="task-list">
                    {visibleTasks.map(task => (
                        <TaskItem key={task.id} task={task} isDisabled={isSaving} onToggle={handleToggle} />
                    ))}
                </ul>
            )}
        </section>
    )
}
