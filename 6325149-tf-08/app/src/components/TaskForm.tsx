import { useState } from "react"

type Props = {
  onAdd: (name: string) => void
}

export function TaskForm({ onAdd }: Props) {
  const [name, setName] = useState<string>("")

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleAdd = () => {
    const trimmed = name.trim()
    if (trimmed === "") return
    onAdd(trimmed)
    setName("")
  }

  return (
    <div className="form">
      <input
        type="text"
        value={name}
        onChange={handleChange}
        placeholder="Nova task"
      />
      <button onClick={handleAdd}>Adicionar</button>
    </div>
  )
}
