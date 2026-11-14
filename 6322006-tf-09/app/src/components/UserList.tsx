import { useState } from "react"
import { useAxios } from "../hooks/useAxios"
import { UserItem } from "./UserItem"
import type { PaginatedResponse, User } from "../types/api"

type UserListProps = {
    selectedId: number | null
    onChoose: (user: User) => void
}

export function UserList({ selectedId, onChoose }: UserListProps) {
    const [page, setPage] = useState(1)
    const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(
        `/users?page=${page}&limit=5`
    )

    const hasNext = data !== null && data.next !== null

    function handlePrevious() {
        setPage(current => Math.max(1, current - 1))
    }

    function handleNext() {
        setPage(current => current + 1)
    }

    function handleRetry() {
        refetch()
    }

    return (
        <section className="panel">
            <h2>Usuários</h2>

            {isLoading && <p className="muted">Carregando...</p>}

            {!isLoading && error !== "" && (
                <div className="error">
                    <p>{error}</p>
                    <button onClick={handleRetry}>Tentar de novo</button>
                </div>
            )}

            {!isLoading && error === "" && data !== null && (
                <ul className="user-list">
                    {data.data.map(user => (
                        <UserItem
                            key={user.id}
                            user={user}
                            isSelected={user.id === selectedId}
                            onChoose={onChoose}
                        />
                    ))}
                </ul>
            )}

            <div className="pagination">
                <button onClick={handlePrevious} disabled={page === 1 || isLoading}>Anterior</button>
                <span>Página {page}</span>
                <button onClick={handleNext} disabled={!hasNext || isLoading}>Próxima</button>
            </div>
        </section>
    )
}
