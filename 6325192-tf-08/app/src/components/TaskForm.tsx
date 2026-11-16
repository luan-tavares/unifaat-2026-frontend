import { useState } from 'react'

type Props = {
  onAdd: (name: string) => void
}

export function TaskForm({ onAdd }: Props) {
  const [name, setName] = useState('')

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    setName(event.target.value)
  }

  function handleAdd() {
    const trimmed = name.trim()
    if (!trimmed) {
      return
    }
    onAdd(trimmed)
    setName('')
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    handleAdd()
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label htmlFor="task-name">Nova task</label>
      <div className="form-row">
        <input id="task-name" value={name} onChange={handleChange} placeholder="O que você precisa fazer?" />
        <button type="button" onClick={handleAdd}>Adicionar</button>
      </div>
    </form>
  )
}
