import { useState } from 'react'

type Props = {
  onAdd: (name: string) => void
}

function TaskForm({ onAdd }: Props) {
  const [name, setName] = useState('')

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setName('')
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <div className="task-form">
      <input
        type="text"
        placeholder="Nome da task..."
        value={name}
        onChange={handleNameChange}
        onKeyDown={handleKeyDown}
      />
      <button onClick={handleAdd}>Adicionar</button>
    </div>
  )
}

export default TaskForm
