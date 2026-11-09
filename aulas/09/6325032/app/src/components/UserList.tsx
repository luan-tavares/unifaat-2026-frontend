import { useState } from "react"
import { useAxios } from "../hooks/useAxios"
import type { PaginatedResponse, User } from "../types"

type UserItemProps = {
    user: User
    isSelected: boolean
    onChoose: (user: User) => void
}

const UserItem = ({ user, isSelected, onChoose }: UserItemProps) => {
    const handleChoose = (): void => {
        onChoose(user)
    }

    return (
        <li>
            <button
                type="button"
                className={isSelected ? "item selected" : "item"}
                onClick={handleChoose}
            >
                <strong>{user.name}</strong>
                <span>{user.job_title ?? "Sem cargo"}</span>
                <small>{user.email}</small>
            </button>
        </li>
    )
}

type Props = {
    selectedUserId: number | null
    onChoose: (user: User) => void
}

const UserList = ({ selectedUserId, onChoose }: Props) => {
    const [page, setPage] = useState<number>(1)
    const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(
        `/users?page=${page}&limit=5`
    )

    const handlePrevious = (): void => {
        setPage((current) => current - 1)
    }

    const handleNext = (): void => {
        setPage((current) => current + 1)
    }

    const handleRetry = (): void => {
        refetch()
    }

    const isNextDisabled = data === null || data.next === null

    return (
        <section className="panel">
            <h2>Usuários</h2>

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
                    {data.data.map((user) => (
                        <UserItem
                            key={user.id}
                            user={user}
                            isSelected={user.id === selectedUserId}
                            onChoose={onChoose}
                        />
                    ))}
                </ul>
            )}

            <div className="pager">
                <button type="button" onClick={handlePrevious} disabled={page <= 1}>
                    Anterior
                </button>
                <span>Página {page}</span>
                <button type="button" onClick={handleNext} disabled={isNextDisabled}>
                    Próxima
                </button>
            </div>
        </section>
    )
}

export default UserList
