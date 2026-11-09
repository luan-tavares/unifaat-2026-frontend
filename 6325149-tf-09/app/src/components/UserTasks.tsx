import { useEffect, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { clientApi } from "../api/clientApi"
import { useAxios } from "../hooks/useAxios"
import type { PaginatedResponse, Task, User } from "../types"
import { getErrorMessage } from "../utils/getErrorMessage"
import { TaskItem } from "./TaskItem"

type Props = {
    user: User
}

const DEFAULT_TITLE = "TF-09 · Usuários e Tasks"

export function UserTasks({ user }: Props) {
    const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(
        `/users/${user.id}/tasks?page=1&limit=20`,
    )
    const [filter, setFilter] = useState<string>("")
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const responsesCountRef = useRef<number>(0)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    useEffect(() => {
        if (data === null) return
        responsesCountRef.current += 1
    }, [data])

    const total = data === null ? null : data.total

    useEffect(() => {
        document.title = total === null ? user.name : `${user.name} · ${total} tasks`
        return () => {
            document.title = DEFAULT_TITLE
        }
    }, [user.name, total])

    function handleFilterChange(event: ChangeEvent<HTMLInputElement>) {
        setFilter(event.target.value)
    }

    function handleClear() {
        setFilter("")
        inputRef.current?.focus()
    }

    function handleShowCount() {
        console.log(`Respostas de tasks recebidas: ${responsesCountRef.current}`)
    }

    async function handleToggle(task: Task) {
        setIsSaving(true)
        setSaveError(null)

        try {
            await clientApi.put(`/users/${user.id}/tasks/${task.id}`, { is_done: !task.is_done })
            refetch()
        } catch (err) {
            setSaveError(getErrorMessage(err))
        } finally {
            setIsSaving(false)
        }
    }

    const normalizedFilter = filter.trim().toLowerCase()
    const visibleTasks =
        data === null
            ? []
            : data.data.filter((task) => task.name.toLowerCase().includes(normalizedFilter))

    return (
        <section>
            <h2>Tasks de {user.name}</h2>
            <div className="filter">
                <input
                    ref={inputRef}
                    value={filter}
                    onChange={handleFilterChange}
                    placeholder="Filtrar por nome"
                />
                <button onClick={handleClear}>Limpar</button>
                <button onClick={handleShowCount}>Mostrar</button>
            </div>
            {isSaving && <p>Salvando...</p>}
            {saveError !== null && <p role="alert">{saveError}</p>}
            {isLoading && <p>Carregando...</p>}
            {error !== null && (
                <p role="alert">
                    {error} <button onClick={refetch}>Tentar de novo</button>
                </p>
            )}
            {data !== null && (
                <ul>
                    {visibleTasks.map((task) => (
                        <TaskItem key={task.id} task={task} onToggle={handleToggle} />
                    ))}
                </ul>
            )}
        </section>
    )
}
