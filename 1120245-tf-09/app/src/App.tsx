import { useState } from "react"
import { UserList } from "./components/UserList"
import { UserTasks } from "./components/UserTasks"
import type { User } from "./types"

export function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  function handleSelect(user: User) {
    setSelectedUser(user)
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "24px",
        maxWidth: "900px",
        margin: "32px auto",
        padding: "0 16px",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ width: "280px", flexShrink: 0 }}>
        <UserList onSelect={handleSelect} selectedId={selectedUser?.id ?? null} />
      </div>

      <div style={{ flex: 1 }}>
        {selectedUser === null && (
          <p style={{ color: "#888", marginTop: "8px" }}>
            Escolha um usuário para ver as tasks.
          </p>
        )}
        {selectedUser !== null && (
          <UserTasks key={selectedUser.id} user={selectedUser} />
        )}
      </div>
    </div>
  )
}
