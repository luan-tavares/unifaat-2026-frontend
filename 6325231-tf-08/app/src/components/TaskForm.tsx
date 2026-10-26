import type { ChangeEvent } from 'react'

type Props = {
  name: string
  onNameChange: (name: string) => void
  onAdd: () => void
}

export default function TaskForm({ name, onNameChange, onAdd }: Props) {
  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    onNameChange(event.target.value)
  }

  function handleAdd() {
    onAdd()
  }

  return (
    <div className="task-form">
      <label htmlFor="task-name">Nova task</label>
      <div className="task-form-row">
        <input
          id="task-name"
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="O que precisa ser feito?"
        />
        <button type="button" onClick={handleAdd}>Adicionar</button>
      </div>
    </div>
  )
}
