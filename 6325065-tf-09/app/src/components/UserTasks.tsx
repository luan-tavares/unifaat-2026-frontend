import { useEffect, useRef, useState } from "react"
import type { ChangeEvent } from "react"
import type { PaginatedResponse, Task, User } from "../types"
import { useAxios } from "../hooks/useAxios"
import { TaskItem } from "./TaskItem"

type Props = {
    user: User
    onCountChange: (count: number) => void
}

export function UserTasks({ user, onCountChange }: Props) {
    const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(
        `/users/${user.id}/tasks?page=1&limit=20`,
    )
    const [filter, setFilter] = useState<string>("")
    const inputRef = useRef<HTMLInputElement>(null)
    const responsesRef = useRef<number>(0)
    const outputRef = useRef<HTMLSpanElement>(null)

    // Foco automático no campo de filtro quando a tela monta
    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    // Dado de bastidor: conta as respostas recebidas sem re-renderizar
    useEffect(() => {
        if (data === null) {
            return
        }
        responsesRef.current += 1
    }, [data])

    // Avisa o App da quantidade de tasks (para o título da aba)
    useEffect(() => {
        if (data === null) {
            return
        }
        onCountChange(data.total)
    }, [data, onCountChange])

    const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
        setFilter(event.target.value)
    }

    const handleClear = () => {
        setFilter("")
        inputRef.current?.focus()
    }

    const handleRetry = () => {
        refetch()
    }

    const handleShow = () => {
        const message = `Respostas de tasks recebidas: ${responsesRef.current}`
        console.log(message)
        if (outputRef.current === null) {
            return
        }
        outputRef.current.textContent = message
    }

    const normalizedFilter = filter.trim().toLowerCase()
    const visibleTasks = (data?.data ?? []).filter((task) =>
        task.name.toLowerCase().includes(normalizedFilter),
    )

    return (
        <section>
            <h2>Tasks de {user.name}</h2>

            <div>
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Filtrar por nome"
                    value={filter}
                    onChange={handleFilterChange}
                />
                <button type="button" onClick={handleClear}>Limpar</button>
            </div>

            {isLoading && <p>Carregando...</p>}

            {error !== null && (
                <div>
                    <p>Erro: {error}</p>
                    <button type="button" onClick={handleRetry}>Tentar de novo</button>
                </div>
            )}

            {data !== null && (
                <ul>
                    {visibleTasks.map((task) => (
                        <TaskItem key={task.id} userId={user.id} task={task} onSaved={refetch} />
                    ))}
                </ul>
            )}

            <div>
                <button type="button" onClick={handleShow}>Mostrar</button>
                <span ref={outputRef}></span>
            </div>
        </section>
    )
}
