import { useState } from "react"
import { useAxios } from "../hooks/useAxios"
import type { PaginatedResponse, User } from "../types"

type UserListProps = {
  onSelect: (user: User) => void
  selectedId: number | null
}

export function UserList({ onSelect, selectedId }: UserListProps) {
  const [page, setPage] = useState(1)
  const url = `/users?page=${page}&limit=5`
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(url)

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
    return <p style={{ color: "#888" }}>Carregando usuários...</p>
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

  return (
    <div>
      <h2 style={{ fontSize: "16px", marginBottom: "8px" }}>Usuários</h2>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {data.data.map((user) => {
          function handleClick() {
            onSelect(user)
          }

          return (
            <li
              key={user.id}
              onClick={handleClick}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                borderBottom: "1px solid #e0e0e0",
                background: selectedId === user.id ? "#e3f2fd" : "#fff",
                fontWeight: selectedId === user.id ? "bold" : "normal",
              }}
            >
              <div>{user.name}</div>
              <div style={{ fontSize: "12px", color: "#888" }}>
                {user.email}
                {user.job_title ? ` · ${user.job_title}` : ""}
              </div>
            </li>
          )
        })}
      </ul>

      <div style={{ display: "flex", gap: "8px", marginTop: "12px", alignItems: "center" }}>
        <button onClick={handlePrev} disabled={page <= 1}>
          ← Anterior
        </button>
        <span style={{ fontSize: "13px", color: "#666" }}>Página {page}</span>
        <button onClick={handleNext} disabled={data.next === null}>
          Próxima →
        </button>
      </div>
    </div>
  )
}
