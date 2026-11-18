import type { User } from "../types/api"

type UserItemProps = {
    user: User
    isSelected: boolean
    onChoose: (user: User) => void
}

export function UserItem({ user, isSelected, onChoose }: UserItemProps) {
    const className = isSelected ? "user-item is-selected" : "user-item"

    function handleChoose() {
        onChoose(user)
    }

    return (
        <li>
            <button className={className} onClick={handleChoose}>
                <strong>{user.name}</strong>
                <small>{user.job_title ?? user.email}</small>
            </button>
        </li>
    )
}
