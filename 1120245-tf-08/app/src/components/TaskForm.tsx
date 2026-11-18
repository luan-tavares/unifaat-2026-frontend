import { useState } from "react"

type TaskFormProps = {
  onAdd: (name: string) => void
}

export function TaskForm({ onAdd }: TaskFormProps) {
  const [name, setName] = useState("")

  function handleAdd() {
    if (name.trim() === "") return
    onAdd(name.trim())
    setName("")
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") handleAdd()
  }

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Digite a tarefa..."
        style={{ flex: 1, padding: "8px", fontSize: "14px" }}
      />
      <button onClick={handleAdd} style={{ padding: "8px 16px", cursor: "pointer" }}>
        Adicionar
      </button>
    </div>
  )
}
