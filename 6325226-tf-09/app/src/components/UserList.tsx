import { useState } from "react"
import { useAxios } from "../hooks/useAxios"
import type { PaginatedResponse, User } from "../types/api"
import ErrorMessage from "./ErrorMessage"
import UserItem from "./UserItem"

type Props = {
    selectedId: number | null
    onChoose: (user: User) => void
}

export default function UserList({ selectedId, onChoose }: Props) {
    const [page, setPage] = useState(1)
    const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(
        `/users?page=${page}&limit=5`
    )

    function handlePrevious() {
        setPage(current => Math.max(1, current - 1))
    }

    function handleNext() {
        setPage(current => current + 1)
    }

    const isFirstPage = page === 1
    const isLastPage = data === null || data.next === null

    return (
        <section className="panel">
            <h2>
                <span className="kanji" aria-hidden="true">隊士</span>
                Usuários
            </h2>

            {isLoading && <p className="loading">Carregando...</p>}
            {!isLoading && error !== "" && <ErrorMessage message={error} onRetry={refetch} />}
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
                <button type="button" onClick={handlePrevious} disabled={isFirstPage || isLoading}>
                    Anterior
                </button>
                <span>Página {page}</span>
                <button type="button" onClick={handleNext} disabled={isLastPage || isLoading}>
                    Próxima
                </button>
            </div>
        </section>
    )
}
