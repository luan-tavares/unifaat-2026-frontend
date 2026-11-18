import { useEffect, useRef, useState, type ChangeEvent } from "react"
import { isCancel } from "axios"
import { useAxios } from "../hooks/useAxios"
import clientApi from "../api/clientApi"
import type { Task, PaginatedResponse, User } from "../types"

type UserTasksProps = {
  user: User
}

export function UserTasks({ user }: UserTasksProps) {
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(
    `/users/${user.id}/tasks?page=1&limit=20`
  )

  // Requisito 7: filtro local por nome com useRef
  const [filterText, setFilterText] = useState("")
  const filterInputRef = useRef<HTMLInputElement>(null)

  // Requisito 6: estado do PUT
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  // Requisito 8: dado de bastidor — conta respostas recebidas, não renderiza a tela
  const responseCountRef = useRef(0)

  // Requisito 7: foco automático ao montar
  useEffect(() => {
    filterInputRef.current?.focus()
  }, [])

  // Requisito 8: incrementa o contador quando data chega
  useEffect(() => {
    if (data === null) return
    responseCountRef.current += 1
  }, [data])

  function handleFilterChange(event: ChangeEvent<HTMLInputElement>) {
    setFilterText(event.target.value)
  }

  function handleClearFilter() {
    setFilterText("")
    filterInputRef.current?.focus()
  }

  function handleRetry() {
    refetch()
  }

  function handleShowCount() {
    console.log("Respostas de tasks recebidas:", responseCountRef.current)
    alert(`Respostas de tasks recebidas: ${responseCountRef.current}`)
  }

  async function handleToggle(task: Task) {
    setIsSaving(true)
    setSaveError("")

    const controller = new AbortController()

    try {
      await clientApi.put(
        `/users/${user.id}/tasks/${task.id}`,
        { is_done: !task.is_done },
        { signal: controller.signal }
      )
      refetch()
    } catch (err) {
      if (isCancel(err)) return
      setSaveError(
        err instanceof Error ? err.message : "Erro ao salvar a task"
      )
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return <p>Carregando as tasks de {user.name}...</p>
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

  const tasks = data.data

  const filteredTasks = tasks.filter((task) =>
    task.name.toLowerCase().includes(filterText.toLowerCase())
  )

  return (
    <div>
      <h2>Tasks de {user.name}</h2>

      {/* Requisito 7: campo de filtro com useRef */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          ref={filterInputRef}
          type="text"
          placeholder="Filtrar por nome..."
          value={filterText}
          onChange={handleFilterChange}
        />
        <button onClick={handleClearFilter}>Limpar</button>
      </div>

      {/* Requisito 8: botão Mostrar para o dado de bastidor */}
      <button onClick={handleShowCount} style={{ marginBottom: "0.5rem" }}>
        Mostrar respostas recebidas
      </button>

      {isSaving && <p>Salvando...</p>}
      {saveError !== "" && <p style={{ color: "red" }}>{saveError}</p>}

      {filteredTasks.length === 0 && <p>Nenhuma task encontrada.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {filteredTasks.map((task) => (
          <li
            key={task.id}
            onClick={() => handleToggle(task)}
            style={{
              cursor: "pointer",
              marginBottom: "0.5rem",
              textDecoration: task.is_done ? "line-through" : "none",
              color: task.is_done ? "#999" : "inherit",
            }}
          >
            <span
              style={{
                display: "inline-block",
                marginRight: "0.5rem",
                fontSize: "0.75em",
                padding: "0.1rem 0.4rem",
                borderRadius: "4px",
                background: task.is_done ? "#4caf50" : "#bbb",
                color: "#fff",
              }}
            >
              {task.is_done ? "feita" : "pendente"}
            </span>
            {task.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
