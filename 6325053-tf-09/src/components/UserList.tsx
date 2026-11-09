import { useState } from 'react'
import type { MouseEvent } from 'react'
import { useAxios } from '../hooks/useAxios'
import type { PaginatedResponse, User } from '../types'

type Props = {
  onChoose: (user: User) => void
  selectedUserId: number | null
}

export const UserList = ({ onChoose, selectedUserId }: Props) => {
  const [page, setPage] = useState(1)
  const url = `/users?page=${page}&limit=5`
  const { data, error, isLoading, refetch } =
    useAxios<PaginatedResponse<User>>(url)

  function handleChoose(event: MouseEvent<HTMLButtonElement>): void {
    const userId = Number(event.currentTarget.dataset.userId)
    const chosenUser = data?.data.find((user) => user.id === userId)

    if (chosenUser !== undefined) {
      onChoose(chosenUser)
    }
  }

  function handlePrevious(): void {
    setPage((currentPage) => Math.max(1, currentPage - 1))
  }

  function handleNext(): void {
    setPage((currentPage) => currentPage + 1)
  }

  if (isLoading) {
    return <p className="status">Carregando usuários...</p>
  }

  if (error !== null) {
    return (
      <div className="status error">
        <p>Erro ao carregar usuários: {error}</p>
        <button type="button" onClick={refetch}>Tentar de novo</button>
      </div>
    )
  }

  if (data === null) {
    return null
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">CADASTROS</p>
          <h2>Usuários</h2>
        </div>
        <span className="count">{data.total} no total</span>
      </div>

      <ul className="user-list">
        {data.data.map((user) => (
          <li key={user.id}>
            <button
              className={`user-option${selectedUserId === user.id ? ' selected' : ''}`}
              type="button"
              data-user-id={user.id}
              onClick={handleChoose}
            >
              <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="user-copy">
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </span>
              <span className="chevron">›</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="pagination">
        <button type="button" onClick={handlePrevious} disabled={page === 1}>
          Anterior
        </button>
        <span>Página {data.page}</span>
        <button type="button" onClick={handleNext} disabled={data.next === null}>
          Próxima
        </button>
      </div>
    </section>
  )
}

