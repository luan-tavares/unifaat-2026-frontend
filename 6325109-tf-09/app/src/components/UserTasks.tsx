import { useEffect, useRef, useState } from "react"
import { clientApi } from "../api/clientApi"
import { useAxios } from "../hooks/useAxios"
import type { PaginatedResponse, Task, User } from "../types"

type Props = {
    user: User
}

const DEFAULT_TITLE = "TF-09 · Usuários e Tasks"

export function UserTasks({ user }: Props) {
    const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(
        `/users/${user.id}/tasks?page=1&limit=20`
    )
    const [filter, setFilter] = useState<string>("")
    const [isSaving, setIsSaving] = useState<boolean>(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [shownCount, setShownCount] = useState<number | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const responsesRef = useRef<number>(0)
    const total = data?.total ?? null

    // foco automático quando a tela monta
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    // dado de bastidor: conta as respostas sem renderizar a tela
    useEffect(() => {
        if (data === null) {
            return
        }
        responsesRef.current += 1
    }, [data])

    // sincroniza o título da aba; a limpeza volta ao título padrão
    useEffect(() => {
        document.title = total === null ? user.name : `${user.name} · ${total} tasks`
        return () => {
            document.title = DEFAULT_TITLE
        }
    }, [user.name, total])

    function handleFilterChange(event: React.ChangeEvent<HTMLInputElement>): void {
        setFilter(event.target.value)
    }

    function handleClear(): void {
        setFilter("")
        inputRef.current?.focus()
    }

    function handleShow(): void {
        console.log(`Respostas de tasks recebidas: ${responsesRef.current}`)
        setShownCount(responsesRef.current)
    }

    function handleRetry(): void {
        refetch()
    }

    async function handleToggle(task: Task): Promise<void> {
        setIsSaving(true)
        setSaveError(null)
        try {
            await clientApi.put<Task>(`/users/${user.id}/tasks/${task.id}`, {
                is_done: !task.is_done
            })
            refetch()
        } catch (err) {
            setSaveError(err instanceof Error ? err.message : "Erro ao salvar a task")
        }
        setIsSaving(false)
    }

    const normalizedFilter = filter.trim().toLowerCase()
    const visibleTasks = (data?.data ?? []).filter((task) =>
        task.name.toLowerCase().includes(normalizedFilter)
    )

    return (
        <section>
            <h2>Tasks de {user.name}</h2>
            <div>
                <input
                    ref={inputRef}
                    type="text"
                    value={filter}
                    onChange={handleFilterChange}
                    placeholder="Filtrar por nome"
                    aria-label="Filtrar tasks por nome"
                />{" "}
                <button type="button" onClick={handleClear}>
                    Limpar
                </button>{" "}
                <button type="button" onClick={handleShow}>
                    Mostrar
                </button>
                {shownCount !== null && <span> Respostas recebidas: {shownCount}</span>}
            </div>
            {isSaving && <p>Salvando...</p>}
            {saveError && <p role="alert">{saveError}</p>}
            {isLoading && <p>Carregando...</p>}
            {error && (
                <div role="alert">
                    <p>{error}</p>
                    <button type="button" onClick={handleRetry}>
                        Tentar de novo
                    </button>
                </div>
            )}
            {data && !isLoading && (
                <ul style={{ listStyle: "none", padding: 0 }}>
                    {visibleTasks.map((task) => (
                        <TaskItem key={task.id} task={task} isDisabled={isSaving} onToggle={handleToggle} />
                    ))}
                </ul>
            )}
        </section>
    )
}

type TaskItemProps = {
    task: Task
    isDisabled: boolean
    onToggle: (task: Task) => void
}

function TaskItem({ task, isDisabled, onToggle }: TaskItemProps) {
    function handleClick(): void {
        onToggle(task)
    }

    return (
        <li>
            <button
                type="button"
                onClick={handleClick}
                disabled={isDisabled}
                style={{ textDecoration: task.is_done ? "line-through" : "none" }}
            >
                {task.is_done ? "✅" : "⬜"} {task.name}
            </button>
        </li>
    )
}
