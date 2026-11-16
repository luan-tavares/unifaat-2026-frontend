import type { User } from '../types'

type Props = {
  user: User
  isSelected: boolean
  onChoose: (user: User) => void
}

export default function UserItem({ user, isSelected, onChoose }: Props) {
  function handleChoose() {
    onChoose(user)
  }

  return (
    <li>
      <button type="button" className={`user-item ${isSelected ? 'active' : ''}`} onClick={handleChoose}>
        <strong>{user.name}</strong>
        <span>{user.job_title ?? user.email}</span>
      </button>
    </li>
  )
}
