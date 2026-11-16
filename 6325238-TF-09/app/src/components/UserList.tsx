
import { useState, type MouseEvent } from 'react'
import useAxios from '../hooks/useAxios'
import type { User, PaginatedResponse } from '../types'

type Props = {
  onChoose: (user: User) => void
  selectedUserId: number | null
}

const UserList = ({
  onChoose,
  selectedUserId,
}: Props): React.JSX.Element => {
  const [page, setPage] = useState(1)

  const { data, error, isLoading, refetch } =
    useAxios<PaginatedResponse<User>>(
      `/users?page=${page}&limit=5`
    )

  const handleChoose = (
    event: MouseEvent<HTMLButtonElement>
  ): void => {
    const userId = Number(event.currentTarget.value)
    const user = data?.data.find((item) => item.id === userId)

    if (user !== undefined) {
      onChoose(user)
    }
  }

  const handlePrevious = (): void => {
    setPage((previous) => Math.max(1, previous - 1))
  }

  const handleNext = (): void => {
    if (data?.next === null || data?.next === undefined) {
      return
    }

    setPage(data.next)
  }

  if (isLoading) {
    return (
      <section>
        <h2>Usuários</h2>
        <p>Carregando...</p>
      </section>
    )
  }

  if (error !== null) {
    return (
      <section>
        <h2>Usuários</h2>
        <p>Erro: {error}</p>
        <button type="button" onClick={refetch}>
          Tentar de novo
        </button>
      </section>
    )
  }

  return (
    <section>
      <h2>Usuários</h2>

      {data !== null && (
        <>
          <p>Total de usuários: {data.total}</p>

          <ul>
            {data.data.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  value={user.id}
                  onClick={handleChoose}
                  aria-pressed={selectedUserId === user.id}
                >
                  {user.name} — {user.email}
                  {user.job_title !== null &&
                    ` (${user.job_title})`}
                </button>
              </li>
            ))}
          </ul>

          <p>Página {data.page}</p>

          <button
            type="button"
            onClick={handlePrevious}
            disabled={page === 1}
          >
            Anterior
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={data.next === null}
          >
            Próxima
          </button>
        </>
      )}
    </section>
  )
}

export default UserList
