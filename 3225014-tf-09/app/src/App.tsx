import { useEffect, useState } from "react"
import { UserList } from "./components/UserList"
import { UserTasks } from "./components/UserTasks"
import type { User } from "./types"

export function App() {
  const [selected, setSelected] = useState<User | null>(null)

  // Requisito 9: título da aba sincronizado com o usuário escolhido
  useEffect(() => {
    if (selected === null) {
      document.title = "TF09 — Task Manager"
      return
    }
    document.title = `${selected.name} · tasks`
  }, [selected])

  function handleSelect(user: User) {
    setSelected(user)
  }

  return (
    <div style={{ display: "flex", gap: "2rem", padding: "1.5rem", fontFamily: "sans-serif" }}>
      <aside style={{ minWidth: "240px", borderRight: "1px solid #ddd", paddingRight: "1.5rem" }}>
        <UserList onSelect={handleSelect} selectedId={selected?.id ?? null} />
      </aside>

      <main style={{ flex: 1 }}>
        {selected === null && (
          <p style={{ color: "#888" }}>Escolha um usuário para ver as tasks.</p>
        )}
        {selected !== null && (
          <UserTasks key={selected.id} user={selected} />
        )}
      </main>
    </div>
  )
}
