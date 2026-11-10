import { useState } from "react"
import UserList from "./components/UserList"
import UserTasks from "./components/UserTasks"
import type { User } from "./types"
import "./App.css"

const App = () => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null)

    const handleChoose = (user: User): void => {
        setSelectedUser(user)
    }

    const handleDeselect = (): void => {
        setSelectedUser(null)
    }

    return (
        <main className="app">
            <h1>Usuários e Tarefas</h1>
            <div className="columns">
                <UserList
                    selectedUserId={selectedUser === null ? null : selectedUser.id}
                    onChoose={handleChoose}
                />
                <div>
                    {selectedUser === null && (
                        <section className="panel">
                            <p>Escolha um usuário para ver as tarefas.</p>
                        </section>
                    )}
                    {selectedUser !== null && (
                        <>
                            <button type="button" onClick={handleDeselect}>
                                Limpar seleção
                            </button>
                            <UserTasks key={selectedUser.id} user={selectedUser} />
                        </>
                    )}
                </div>
            </div>
        </main>
    )
}

export default App
