import { useState } from 'react'
import useAxios from '../hooks/useAxios'
import { User, PaginatedResponse } from '../types'

type Props = {
  selectedUserId: number | null
  onSelectUser: (user: User) => void
}

function UserList({ selectedUserId, onSelectUser }: Props) {
  const [page, setPage] = useState<number>(1)

  const url = `/users?page=${page}&limit=5`
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(url)

  function handlePrev() {
    setPage((current) => current - 1)
  }

  function handleNext() {
    setPage((current) => current + 1)
  }

  function handleChoose(user: User) {
    onSelectUser(user)
  }

  function handleRetry() {
    refetch()
  }

  if (isLoading) {
    return <p>Carregando...</p>
  }

  if (error) {
    return (
      <div>
        <p>Erro: {error}</p>
        <button onClick={handleRetry}>Tentar de novo</button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div>
      <h2>Usuários</h2>
      <ul>
        {data.data.map((user) => (
          <li key={user.id}>
            <button
              onClick={() => handleChoose(user)}
              style={{ fontWeight: selectedUserId === user.id ? 'bold' : 'normal' }}
            >
              {user.name}
            </button>
          </li>
        ))}
      </ul>
      <div>
        <button onClick={handlePrev} disabled={page === 1}>
          Anterior
        </button>
        <span> Página {page} </span>
        <button onClick={handleNext} disabled={data.next === null}>
          Próxima
        </button>
      </div>
    </div>
  )
}

export default UserList
