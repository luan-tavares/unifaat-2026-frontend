import { useEffect, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import { clientApi } from "../api/clientApi"
import { getErrorMessage } from "../api/getErrorMessage"
import { DEFAULT_TITLE } from "../constants"
import { useAxios } from "../hooks/useAxios"
import type { PaginatedResponse, Task, User } from "../types"

type TaskItemProps = {
    task: Task
    onToggle: (task: Task) => void
}

const TaskItem = ({ task, onToggle }: TaskItemProps) => {
    const handleToggle = (): void => {
        onToggle(task)
    }

    return (
        <li>
            <button
                type="button"
                className={task.is_done ? "item done" : "item"}
                onClick={handleToggle}
            >
                <span>{task.is_done ? "✅" : "⬜"}</span>
                <span>{task.name}</span>
            </button>
        </li>
    )
}

type Props = {
    user: User
}

const UserTasks = ({ user }: Props) => {
    const [filter, setFilter] = useState<string>("")
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const filterRef = useRef<HTMLInputElement>(null)
    const receivedCountRef = useRef<number>(0)

    const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(
        `/users/${user.id}/tasks?page=1&limit=20`
    )

    const total = data === null ? null : data.total

    // foco automático ao montar
    useEffect(() => {
        filterRef.current?.focus()
    }, [])

    // dado de bastidor: quantas respostas de tarefas já chegaram (não renderiza)
    useEffect(() => {
        if (data === null) {
            return
        }
        receivedCountRef.current += 1
    }, [data])

    // sincroniza o título da aba
    useEffect(() => {
        document.title =
            total === null ? user.name : `${user.name} · ${total} tasks`
        return () => {
            document.title = DEFAULT_TITLE
        }
    }, [user.name, total])

    const handleFilterChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setFilter(event.target.value)
    }

    const handleClear = (): void => {
        setFilter("")
        filterRef.current?.focus()
    }

    const handleShowCount = (): void => {
        console.log(`Respostas de tarefas recebidas: ${receivedCountRef.current}`)
    }

    const handleRetry = (): void => {
        refetch()
    }

    const handleToggle = async (task: Task): Promise<void> => {
        if (isSaving) {
            return
        }
        setIsSaving(true)
        setSaveError(null)
        try {
            await clientApi.put<Task>(`/users/${user.id}/tasks/${task.id}`, {
                is_done: !task.is_done,
            })
            refetch()
        } catch (err) {
            setSaveError(getErrorMessage(err))
        }
        setIsSaving(false)
    }

    const normalizedFilter = filter.trim().toLowerCase()
    const visibleTasks =
        data === null
            ? []
            : data.data.filter((task) => task.name.toLowerCase().includes(normalizedFilter))

    return (
        <section className="panel">
            <h2>Tarefas de {user.name}</h2>

            <div className="filter">
                <input
                    ref={filterRef}
                    type="text"
                    placeholder="Filtrar por nome..."
                    value={filter}
                    onChange={handleFilterChange}
                />
                <button type="button" onClick={handleClear}>
                    Limpar
                </button>
                <button type="button" onClick={handleShowCount}>
                    Mostrar
                </button>
            </div>

            {isSaving && <p>Salvando...</p>}
            {saveError !== null && <p className="error">Erro ao salvar: {saveError}</p>}

            {isLoading && <p>Carregando...</p>}

            {error !== null && (
                <div className="error">
                    <p>Erro: {error}</p>
                    <button type="button" onClick={handleRetry}>
                        Tentar de novo
                    </button>
                </div>
            )}

            {data !== null && (
                <ul className="list">
                    {visibleTasks.map((task) => (
                        <TaskItem key={task.id} task={task} onToggle={handleToggle} />
                    ))}
                </ul>
            )}
        </section>
    )
}

export default UserTasks
