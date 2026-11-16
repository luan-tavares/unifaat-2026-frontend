import { useState } from 'react'
import { useAxios } from '../hooks/useAxios'
import UserItem from './UserItem'
import type { PaginatedResponse, User } from '../types'

type Props = {
  selectedId: number | null
  onChoose: (user: User) => void
}

export default function UserList({ selectedId, onChoose }: Props) {
  const [page, setPage] = useState(1)
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(`/users?page=${page}&limit=5`)

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
    <section aria-label="Usuários">
      <h2>Usuários</h2>

      {isLoading && <p className="muted">Carregando...</p>}

      {!isLoading && error !== '' && (
        <div className="error">
          <span>{error}</span>
          <button type="button" onClick={handleRetry}>Tentar de novo</button>
        </div>
      )}

      {!isLoading && error === '' && data !== null && (
        <ul className="list">
          {data.data.map(user => (
            <UserItem key={user.id} user={user} isSelected={user.id === selectedId} onChoose={onChoose} />
          ))}
        </ul>
      )}

      <div className="pagination">
        <button type="button" onClick={handlePrevious} disabled={page === 1}>Anterior</button>
        <span>Página {page}</span>
        <button type="button" onClick={handleNext} disabled={data === null || data.next === null}>Próxima</button>
      </div>
    </section>
  )
}
