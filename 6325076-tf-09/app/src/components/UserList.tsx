import { useState } from 'react'
import type { MouseEvent } from 'react'
import useAxios from '../hooks/useAxios'
import type { User, PaginatedResponse } from '../types'

interface Props {
  onChoose: (user: User) => void
  selectedUserId: number | null
}

function UserList({ onChoose, selectedUserId }: Props) {
  const [page, setPage] = useState(1)

  const { data, error, isLoading, refetch } =
    useAxios<PaginatedResponse<User>>(`/users?page=${page}&limit=5`)

  function handleChoose(event: MouseEvent<HTMLButtonElement>) {
    const userId = Number(event.currentTarget.dataset.userId)
    const user = data?.data.find((item) => item.id === userId)

    if (user) {
      onChoose(user)
    }
  }

  function handlePrevious() {
    setPage((previous) => Math.max(1, previous - 1))
  }

  function handleNext() {
    if (data?.next !== null && data?.next !== undefined) {
      setPage(data.next)
    }
  }

  if (isLoading) return <p>Carregando usuários...</p>

  if (error) {
    return (
      <div>
        <p>Erro ao carregar usuários: {error}</p>
        <button onClick={refetch}>Tentar de novo</button>
      </div>
    )
  }

  if (!data) return <p>Nenhum usuário encontrado.</p>

  return (
    <section>
      <h2>Usuários</h2>

      {data.data.map((user) => (
        <button
          key={user.id}
          data-user-id={user.id}
          onClick={handleChoose}
          className={selectedUserId === user.id ? 'selected' : ''}
        >
          <strong>{user.name}</strong>
          <br />
          {user.email}
          <br />
          {user.job_title ?? 'Cargo não informado'}
        </button>
      ))}

      <div className="pagination">
        <button onClick={handlePrevious} disabled={page === 1}>
          Anterior
        </button>

        <span>Página {page}</span>

        <button onClick={handleNext} disabled={data.next === null}>
          Próxima
        </button>
      </div>
    </section>
  )
}

export default UserList
