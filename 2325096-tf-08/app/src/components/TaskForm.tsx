import { type FormEvent } from "react"

type TaskFormProps = {
  name: string
  onNameChange: (name: string) => void
  onAddTask: (name: string) => void
}

function TaskForm({ name, onNameChange, onAddTask }: TaskFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()

    if (!trimmedName) {
      return
    }

    onAddTask(trimmedName)
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="task-name">Nova tarefa</label>
      <input
        id="task-name"
        type="text"
        value={name}
        onChange={(event) => onNameChange(event.target.value)}
        placeholder="Digite uma tarefa"
      />
      <button type="submit">Adicionar</button>
    </form>
  )
}

export default TaskForm
