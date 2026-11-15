import { useState } from 'react'
import type { ChangeEvent } from 'react'

type Props = {
  onAddTask: (name: string) => void
}

function TaskForm({ onAddTask }: Props) {
  const [taskName, setTaskName] = useState<string>('')

  const handleNameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTaskName(event.target.value)
  }

  const handleAdd = () => {
    const trimmedName = taskName.trim()

    if (!trimmedName) {
      return
    }

    onAddTask(trimmedName)
    setTaskName('')
  }

  return (
    <div className="task-form">
      <label className="input-label" htmlFor="task-name">
        O que você precisa fazer?
      </label>
      <div className="input-row">
        <input
          id="task-name"
          type="text"
          value={taskName}
          onChange={handleNameChange}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleAdd()
            }
          }}
          placeholder="Ex.: Estudar TypeScript"
          maxLength={100}
        />
        <button className="add-button" type="button" onClick={handleAdd}>
          <span aria-hidden="true">+</span> Adicionar
        </button>
      </div>
    </div>
  )
}

export default TaskForm
