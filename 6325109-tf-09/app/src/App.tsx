import { useState } from "react"
import { UserList } from "./components/UserList"
import { UserTasks } from "./components/UserTasks"
import type { User } from "./types"

export function App() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    function handleChoose(user: User): void {
        setSelectedUser(user)
    }

    return (
        <main style={{ display: "flex", gap: "2rem", padding: "1rem", fontFamily: "sans-serif" }}>
            <UserList selectedId={selectedUser?.id ?? null} onChoose={handleChoose} />
            {selectedUser && <UserTasks user={selectedUser} />}
        </main>
    )
}
