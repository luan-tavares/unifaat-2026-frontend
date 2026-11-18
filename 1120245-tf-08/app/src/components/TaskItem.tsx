import type { Task } from "../types"

type TaskItemProps = {
  task: Task
  onToggle: (id: number) => void
  onDelete: (id: number) => void
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  function handleToggle() {
    onToggle(task.id)
  }

  function handleDelete() {
    onDelete(task.id)
  }

  return (
    <li
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 12px",
        borderBottom: "1px solid #e0e0e0",
        gap: "8px",
      }}
    >
      <span
        onClick={handleToggle}
        style={{
          flex: 1,
          cursor: "pointer",
          textDecoration: task.isDone ? "line-through" : "none",
          color: task.isDone ? "#888" : "#222",
          userSelect: "none",
        }}
      >
        {task.name}
      </span>
      <button
        onClick={handleDelete}
        style={{
          padding: "4px 10px",
          cursor: "pointer",
          background: "#e53935",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          fontSize: "12px",
        }}
      >
        Excluir
      </button>
    </li>
  )
}
