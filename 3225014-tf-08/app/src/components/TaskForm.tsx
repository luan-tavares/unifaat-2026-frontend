import { useState, type KeyboardEvent } from "react"

type TaskFormProps = {
  onAdd: (name: string) => void
}

export function TaskForm({ onAdd }: TaskFormProps) {
  const [value, setValue] = useState("")

  function handleAdd() {
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue("")
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") handleAdd()
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Nome da task"
        value={value}
        onChange={event => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button onClick={handleAdd}>Adicionar</button>
    </div>
  )
}
