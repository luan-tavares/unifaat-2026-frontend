import type { User } from "../types/api"

type Props = {
    user: User
    isSelected: boolean
    onChoose: (user: User) => void
}

export default function UserItem({ user, isSelected, onChoose }: Props) {
    function handleChoose() {
        onChoose(user)
    }

    const className = isSelected ? "user-item selected" : "user-item"

    return (
        <li>
            <button type="button" className={className} onClick={handleChoose}>
                <strong>{user.name}</strong>
                <span>{user.job_title ?? "Sem cargo"}</span>
            </button>
        </li>
    )
}
