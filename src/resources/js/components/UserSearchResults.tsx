import type { User } from "../types/api"

type UserSearchResultsProps = {
    users: User[] | null
    total: number
    selectedId: number | null
    onChoose: (user: User) => void
}

export function UserSearchResults({ users, total, selectedId, onChoose }: UserSearchResultsProps) {
    // null = ainda não buscou: não desenha nada
    if (users === null) return null

    if (users.length === 0) {
        return <p className="text-muted mb-0">Nenhum usuário encontrado</p>
    }

    return (
        <>
            <p className="small text-muted mb-2">{total} usuários encontrados</p>

            <ul className="list-group">
                {users.map(user => {
                    const isSelected = user.id === selectedId

                    return (
                        <li key={user.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <span>
                                <strong>{user.name}</strong> · {user.email}
                                <br />
                                <small className="text-muted">
                                    {user.job_title ?? "sem cargo"} · {user.city ?? "sem cidade"}/{user.state ?? "--"}
                                </small>
                            </span>

                            <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                disabled={isSelected}
                                onClick={() => onChoose(user)}
                            >
                                {isSelected ? "Escolhido" : "Escolher"}
                            </button>
                        </li>
                    )
                })}
            </ul>
        </>
    )
}
