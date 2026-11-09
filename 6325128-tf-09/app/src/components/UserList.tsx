import { useState } from 'react'
import { useAxios } from '../hooks/useAxios'
import { User, PaginatedResponse } from '../types'

type Props = {
  onUserSelect: (user: User) => void
}

export function UserList({ onUserSelect }: Props) {
  const [page, setPage] = useState<number>(1)
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(
    `/users?page=${page}&limit=5`
  )

  const handlePrevious = () => {
    setPage((prev) => Math.max(1, prev - 1))
  }

  const handleNext = () => {
    setPage((prev) => prev + 1)
  }

  const handleUserClick = (user: User) => {
    onUserSelect(user)
  }

  if (isLoading) {
    return <div>Carregando...</div>
  }

  if (error) {
    return (
      <div>
        <p>Erro: {error}</p>
        <button type="button" onClick={refetch}>
          Tentar de novo
        </button>
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
            <button type="button" onClick={() => handleUserClick(user)}>
              {user.name} - {user.email}
              {user.job_title && ` (${user.job_title})`}
            </button>
          </li>
        ))}
      </ul>
      <div>
        <button type="button" onClick={handlePrevious} disabled={page === 1}>
          Anterior
        </button>
        <span> Página {page} </span>
        <button type="button" onClick={handleNext} disabled={data.next === null}>
          Próxima
        </button>
      </div>
    </div>
  )
}
