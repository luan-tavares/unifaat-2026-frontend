import { useState } from "react"
import { useAxios } from "../hooks/useAxios"
import type { PaginatedResponse, User } from "../types"

type Props = {
    selectedId: number | null
    onChoose: (user: User) => void
}

export function UserList({ selectedId, onChoose }: Props) {
    const [page, setPage] = useState<number>(1)
    const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(
        `/users?page=${page}&limit=5`
    )

    function handlePrevious(): void {
        setPage((previous) => previous - 1)
    }

    function handleNext(): void {
        setPage((previous) => previous + 1)
    }

    function handleRetry(): void {
        refetch()
    }

    return (
        <section>
            <h2>Usuários</h2>
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
            <button type="button" onClick={handlePrevious} disabled={page <= 1}>
                Anterior
            </button>{" "}
            <span>Página {page}</span>{" "}
            <button type="button" onClick={handleNext} disabled={data?.next == null}>
                Próxima
            </button>
        </section>
    )
}

type UserItemProps = {
    user: User
    isSelected: boolean
    onChoose: (user: User) => void
}

function UserItem({ user, isSelected, onChoose }: UserItemProps) {
    function handleChoose(): void {
        onChoose(user)
    }

    return (
        <li>
            <button
                type="button"
                onClick={handleChoose}
                aria-pressed={isSelected}
                style={{ fontWeight: isSelected ? "bold" : "normal" }}
            >
                {user.name}
                {user.job_title ? ` · ${user.job_title}` : ""}
            </button>
        </li>
    )
}
