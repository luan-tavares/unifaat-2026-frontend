import { useState } from 'react'
import type { MouseEvent } from 'react'
import useAxios from '../hooks/useAxios'
import type { PaginatedResponse, User } from '../types'

type Props = {
  selectedUserId: number | null
  onChooseUser: (user: User) => void
}

function UserList({ selectedUserId, onChooseUser }: Props) {
  const [page, setPage] = useState<number>(1)
  const { data, error, isLoading, refetch } =
    useAxios<PaginatedResponse<User>>(`/users?page=${page}&limit=5`)

  const handleChoose = (event: MouseEvent<HTMLButtonElement>) => {
    const userId = Number(event.currentTarget.dataset.userId)
    if (!Number.isInteger(userId)) return

    const user = data?.data.find((item) => item.id === userId)
    if (user === undefined) return
    onChooseUser(user)
  }

  const handlePrevious = () => {
    setPage((currentPage) => Math.max(1, currentPage - 1))
  }

  const handleNext = () => {
    if (data === null || data.next === null) return
    setPage(data.next)
  }

  const handleRetry = () => {
    refetch()
  }

  return (
    <section className="panel user-panel" aria-labelledby="users-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">PESSOAS</p>
          <h2 id="users-heading">Usuários</h2>
        </div>
        {data !== null && (
          <span className="result-count">{data.total} no total</span>
        )}
      </div>

      {isLoading && <p className="status-message">Carregando...</p>}

      {!isLoading && error !== null && (
        <div className="error-box" role="alert">
          <p>Não foi possível carregar os usuários: {error}</p>
          <button className="secondary-button" type="button" onClick={handleRetry}>
            Tentar de novo
          </button>
        </div>
      )}

      {!isLoading && error === null && data !== null && (
        <>
          {data.data.length === 0 ? (
            <p className="status-message">Nenhum usuário encontrado.</p>
          ) : (
            <ul className="user-list">
              {data.data.map((user) => (
                <li key={user.id}>
                  <button
                    className={`user-option${selectedUserId === user.id ? ' is-selected' : ''}`}
                    type="button"
                    data-user-id={user.id}
                    onClick={handleChoose}
                    aria-pressed={selectedUserId === user.id}
                  >
                    <span className="user-avatar" aria-hidden="true">
                      {user.name.charAt(0).toLocaleUpperCase()}
                    </span>
                    <span className="user-details">
                      <span className="user-name">{user.name}</span>
                      <span className="user-meta">
                        {user.job_title ?? user.email}
                      </span>
                    </span>
                    <span className="user-arrow" aria-hidden="true">
                      →
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <nav className="pagination" aria-label="Paginação de usuários">
            <button
              className="secondary-button"
              type="button"
              onClick={handlePrevious}
              disabled={isLoading || page <= 1}
            >
              Anterior
            </button>
            <span>Página {data.page}</span>
            <button
              className="secondary-button"
              type="button"
              onClick={handleNext}
              disabled={isLoading || data.next === null}
            >
              Próxima
            </button>
          </nav>
        </>
      )}
    </section>
  )
}

export default UserList
