import { useState } from "react"
import { useAxios } from "../hooks/useAxios"
import type { User, PaginatedResponse } from "../types"

type UserListProps = {
  onSelect: (user: User) => void
  selectedId: number | null
}

export function UserList({ onSelect, selectedId }: UserListProps) {
  const [page, setPage] = useState(1)

  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(
    `/users?page=${page}&limit=5`
  )

  function handlePrev() {
    setPage((current) => current - 1)
  }

  function handleNext() {
    setPage((current) => current + 1)
  }

  function handleRetry() {
    refetch()
  }

  if (isLoading) {
    return <p>Carregando usuários...</p>
  }

  if (error !== "") {
    return (
      <div>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={handleRetry}>Tentar de novo</button>
      </div>
    )
  }

  if (data === null) return null

  const users = data.data

  return (
    <div>
      <h2>Usuários</h2>

      {users.length === 0 && <p>Nenhum usuário encontrado.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {users.map((user) => (
          <li key={user.id} style={{ marginBottom: "0.5rem" }}>
            <button
              onClick={() => onSelect(user)}
              style={{
                fontWeight: selectedId === user.id ? "bold" : "normal",
                textDecoration: selectedId === user.id ? "underline" : "none",
                cursor: "pointer",
              }}
            >
              {user.name}
              {user.job_title !== null && (
                <span style={{ marginLeft: "0.5rem", fontSize: "0.85em", color: "#666" }}>
                  — {user.job_title}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
