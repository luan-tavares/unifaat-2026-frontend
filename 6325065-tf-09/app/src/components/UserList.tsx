import { useState } from "react"
import type { PaginatedResponse, User } from "../types"
import { useAxios } from "../hooks/useAxios"
import { UserItem } from "./UserItem"

type Props = {
    selectedUserId: number | null
    onChoose: (user: User) => void
}

export function UserList({ selectedUserId, onChoose }: Props) {
    const [page, setPage] = useState<number>(1)
    const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(
        `/users?page=${page}&limit=5`,
    )

    const handlePrevious = () => {
        setPage((current) => current - 1)
    }

    const handleNext = () => {
        setPage((current) => current + 1)
    }

    const handleRetry = () => {
        refetch()
    }

    if (isLoading) {
        return <p>Carregando...</p>
    }

    if (error !== null) {
        return (
            <div>
                <p>Erro: {error}</p>
                <button type="button" onClick={handleRetry}>Tentar de novo</button>
            </div>
        )
    }

    if (data === null) {
        return null
    }

    return (
        <section>
            <h2>Usuários</h2>
            <ul>
                {data.data.map((user) => (
                    <UserItem
                        key={user.id}
                        user={user}
                        isSelected={user.id === selectedUserId}
                        onChoose={onChoose}
                    />
                ))}
            </ul>
            <div>
                <button type="button" onClick={handlePrevious} disabled={page === 1}>
                    Anterior
                </button>
                <span> Página {data.page} </span>
                <button type="button" onClick={handleNext} disabled={data.next === null}>
                    Próxima
                </button>
            </div>
        </section>
    )
}