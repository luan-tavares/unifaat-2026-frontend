import type { User } from "../types"

type Props = {
    user: User
    isSelected: boolean
    onChoose: (user: User) => void
}

export function UserItem({ user, isSelected, onChoose }: Props) {
    const handleChoose = () => {
        onChoose(user)
    }

    return (
        <li>
            <button type="button" onClick={handleChoose} aria-pressed={isSelected}>
                {isSelected ? "▶ " : ""}
                {user.name}
            </button>
            <small> {user.job_title ?? "Sem cargo"} · {user.email}</small>
        </li>
    )
}