import { useState } from "react"
import UserList from "./components/UserList"
import UserTasks from "./components/UserTasks"
import type { User } from "./types/api"

export default function App() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    function handleChoose(user: User) {
        setSelectedUser(user)
    }

    const selectedId = selectedUser === null ? null : selectedUser.id

    return (
        <main className="app">
            <h1>Usuários e tasks</h1>
            <div className="layout">
                <UserList selectedId={selectedId} onChoose={handleChoose} />
                {selectedUser === null && (
                    <section className="panel">
                        <p>Escolha um usuário para ver as tasks.</p>
                    </section>
                )}
                {selectedUser !== null && <UserTasks key={selectedUser.id} user={selectedUser} />}
            </div>
        </main>
    )
}
