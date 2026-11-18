import { useEffect, useRef, useState } from "react"
import { useAxios } from "../hooks/useAxios"
import clientApi from "../api/clientApi"
import type { PaginatedResponse, Task, User } from "../types"

type UserTasksProps = {
  user: User
}

export function UserTasks({ user }: UserTasksProps) {
  const url = `/users/${user.id}/tasks?page=1&limit=20`
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(url)

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [filter, setFilter] = useState("")

  // useRef: foco automático no campo de filtro
  const filterRef = useRef<HTMLInputElement>(null)

  // useRef (bastidor): conta respostas recebidas sem renderizar
  const responseCountRef = useRef(0)

  // Foco automático quando o componente monta
  useEffect(() => {
    filterRef.current?.focus()
  }, [])

  // Incrementa o contador de bastidor quando data chega
  useEffect(() => {
    if (data === null) return
    responseCountRef.current += 1
  }, [data])

  // Título da aba
  useEffect(() => {
    if (data === null) {
      document.title = "TF-09 · Users & Tasks"
      return
    }
    const count = data.data.length
    document.title = `${user.name} · ${count} task${count !== 1 ? "s" : ""}`

    return () => {
      document.title = "TF-09 · Users & Tasks"
    }
  }, [user.name, data])

  async function handleToggle(task: Task) {
    setIsSaving(true)
    setSaveError("")

    try {
      await clientApi.put(`/users/${user.id}/tasks/${task.id}`, {
        is_done: !task.is_done,
      })
      refetch()
    } catch {
      setSaveError("Erro ao salvar. Tente novamente.")
    }

    setIsSaving(false)
  }

  function handleFilterChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFilter(event.target.value)
  }

  function handleClear() {
    setFilter("")
    filterRef.current?.focus()
  }

  function handleRetry() {
    refetch()
  }

  if (isLoading) {
    return <p style={{ color: "#888" }}>Carregando tasks de {user.name}...</p>
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

  const filteredTasks = data.data.filter((task) =>
    task.name.toLowerCase().includes(filter.toLowerCase())
  )

  function handleShowCount() {
    console.log(`Respostas recebidas: ${responseCountRef.current}`)
    alert(`Respostas de tasks recebidas: ${responseCountRef.current}`)
  }

  return (
    <div>
      <h2 style={{ fontSize: "16px", marginBottom: "8px" }}>
        Tasks de {user.name}
      </h2>

      {isSaving && <p style={{ color: "#1976d2" }}>Salvando...</p>}
      {saveError !== "" && <p style={{ color: "red" }}>{saveError}</p>}

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        <input
          ref={filterRef}
          type="text"
          value={filter}
          onChange={handleFilterChange}
          placeholder="Filtrar por nome..."
          style={{ flex: 1, padding: "6px" }}
        />
        <button onClick={handleClear}>Limpar</button>
        <button onClick={handleShowCount} style={{ fontSize: "12px" }}>
          Mostrar respostas
        </button>
      </div>

      {filteredTasks.length === 0 && (
        <p style={{ color: "#888" }}>Nenhuma task encontrada.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {filteredTasks.map((task) => {
          function handleClick() {
            handleToggle(task)
          }

          return (
            <li
              key={task.id}
              onClick={handleClick}
              style={{
                padding: "10px 12px",
                borderBottom: "1px solid #e0e0e0",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                textDecoration: task.is_done ? "line-through" : "none",
                color: task.is_done ? "#888" : "#222",
              }}
            >
              <span>{task.name}</span>
              <span
                style={{
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: task.is_done ? "#c8e6c9" : "#e0e0e0",
                  color: task.is_done ? "#2e7d32" : "#555",
                }}
              >
                {task.is_done ? "feita" : "pendente"}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
