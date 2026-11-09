import { useState } from "react"
import { useAxios } from "../hooks/useAxios"
import type { PaginatedResponse, User } from "../types"

type Props = {
    selectedId: number | null
    onChoose: (user: User) => void
}

type UserItemProps = {
    user: User
    isSelected: boolean
    onChoose: (user: User) => void
}

function UserItem({ user, isSelected, onChoose }: UserItemProps) {
    function handleChoose() {
        onChoose(user)
    }

    return (
        <li>
            <button className={isSelected ? "selected" : ""} onClick={handleChoose}>
                {user.name}
            </button>
        </li>
    )
}

export function UserList({ selectedId, onChoose }: Props) {
    const [page, setPage] = useState<number>(1)
    const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(
        `/users?page=${page}&limit=5`,
    )

    function handlePrevious() {
        setPage((current) => current - 1)
    }

    function handleNext() {
        setPage((current) => current + 1)
    }

    return (
        <section>
            <h2>Usuários</h2>
            {isLoading && <p>Carregando...</p>}
            {error !== null && (
                <p role="alert">
                    {error} <button onClick={refetch}>Tentar de novo</button>
                </p>
            )}
            {!isLoading && data !== null && (
                <ul>
                    {data.data.map((user) => (
                        <UserItem
                            key={user.id}
                            user={user}
                            isSelected={user.id === selectedId}
                            onChoose={onChoose}
                        />
                    ))}
                </ul>
            )}
            <div className="pager">
                <button onClick={handlePrevious} disabled={page === 1}>
                    Anterior
                </button>
                <span>Página {page}</span>
                <button onClick={handleNext} disabled={data === null || data.next === null}>
                    Próxima
                </button>
            </div>
        </section>
    )
}
