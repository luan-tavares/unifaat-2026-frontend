import { useState } from 'react'
import { useAxios } from '../hooks/useAxios'
import type { PaginatedResponse, User } from '../types'

type Props = { selectedId: number | null; onSelect: (user: User) => void }
type UserButtonProps = { user: User; isSelected: boolean; onSelect: (user: User) => void }

function UserButton({ user, isSelected, onSelect }: UserButtonProps) {
  function handleChoose() { onSelect(user) }
  return <li><button className={isSelected ? 'selected' : ''} onClick={handleChoose}>
    <strong>{user.name}</strong><span>{user.email}</span>
    <small>{user.job_title ?? 'Cargo não informado'}</small>
  </button></li>
}

export function UserList({ selectedId, onSelect }: Props) {
  const [page, setPage] = useState(1)
  const url = `/users?page=${page}&limit=5`
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(url)
  function handlePrevious() { setPage(current => Math.max(1, current - 1)) }
  function handleNext() {
    if (!data || data.next === null) return
    setPage(data.next)
  }
  return <section className="panel">
    <h2>Usuários</h2><p className="muted">Escolha um usuário para visualizar suas tasks.</p>
    {isLoading && <p>Carregando...</p>}
    {error && <div role="alert"><p>{error}</p><button onClick={refetch}>Tentar de novo</button></div>}
    {data && !isLoading && <>
      <ul className="users">{data.data.map(user => <UserButton key={user.id} user={user} isSelected={selectedId === user.id} onSelect={onSelect} />)}</ul>
      <nav className="pagination">
        <button onClick={handlePrevious} disabled={page === 1}>Anterior</button>
        <span>Página {page}</span>
        <button onClick={handleNext} disabled={data.next === null}>Próxima</button>
      </nav>
    </>}
  </section>
}
