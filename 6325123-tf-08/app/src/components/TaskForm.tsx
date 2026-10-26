import { useState, type ChangeEvent } from 'react'

type Props = {
  onAddTask: (name: string) => void
}

export function TaskForm({ onAddTask }: Props) {
  const [name, setName] = useState<string>('')

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleAdd = () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }

    onAddTask(trimmedName)
    setName('')
  }

  return (
    <div className="task-form">
      <label className="visually-hidden" htmlFor="new-task">Nome da task</label>
      <input
        id="new-task"
        type="text"
        value={name}
        onChange={handleNameChange}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            handleAdd()
          }
        }}
        placeholder="O que você precisa fazer?"
      />
      <button className="add-button" type="button" onClick={handleAdd}>
        <span aria-hidden="true">+</span> Adicionar
      </button>
    </div>
  )
}
