import { useState } from 'react'
import useAxios from '../hooks/useAxios'
import { User, PaginatedResponse } from '../types'

type Props = {
  selectedUser: User | null
  onSelectUser: (user: User) => void
}

function UserList({ selectedUser, onSelectUser }: Props) {
  const [page, setPage] = useState<number>(1)

  const url = `/users?page=${page}&limit=5`
  const { data, error, isLoading, refetch } =
    useAxios<PaginatedResponse<User>>(url)

  const handlePrev = () => {
    setPage((prev) => prev - 1)
  }

  const handleNext = () => {
    setPage((prev) => prev + 1)
  }

  const handleSelectUser = (user: User) => {
    onSelectUser(user)
  }

  if (isLoading) {
    return <p>Carregando...</p>
  }

  if (error) {
    return (
      <div>
        <p>Erro: {error}</p>
        <button onClick={refetch}>Tentar de novo</button>
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
          <li
            key={user.id}
            style={{
              cursor: 'pointer',
              fontWeight: selectedUser?.id === user.id ? 'bold' : 'normal',
              background: selectedUser?.id === user.id ? '#e0e0e0' : 'transparent',
              padding: '6px 10px',
              borderRadius: '4px',
              marginBottom: '4px',
              listStyle: 'none',
            }}
            onClick={() => handleSelectUser(user)}
          >
            {user.name} — {user.job_title ?? 'Sem cargo'}
          </li>
        ))}
      </ul>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
        <button onClick={handlePrev} disabled={page === 1}>
          Anterior
        </button>
        <span>Página {page}</span>
        <button onClick={handleNext} disabled={data.next === null}>
          Próxima
        </button>
      </div>
    </div>
  )
}

export default UserList
