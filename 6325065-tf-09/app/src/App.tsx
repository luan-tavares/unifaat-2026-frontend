import { useEffect, useState } from "react"
import type { User } from "./types"
import { UserList } from "./components/UserList"
import { UserTasks } from "./components/UserTasks"

const DEFAULT_TITLE = "Usuários e tasks"

function App() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [taskCount, setTaskCount] = useState<number | null>(null)

    const selectedName = selectedUser?.name ?? null

    // Sincroniza o título da aba com o usuário escolhido e a quantidade de tasks
    useEffect(() => {
        if (selectedName === null) {
            document.title = DEFAULT_TITLE
            return
        }
        if (taskCount === null) {
            document.title = selectedName
            return
        }
        document.title = `${selectedName} · ${taskCount} tasks`
    }, [selectedName, taskCount])

    const handleChoose = (user: User) => {
        if (user.id === selectedUser?.id) {
            return
        }
        setSelectedUser(user)
        setTaskCount(null)
    }

    const handleClose = () => {
        setSelectedUser(null)
        setTaskCount(null)
    }

    return (
        <main>
            <h1>{DEFAULT_TITLE}</h1>
            <UserList selectedUserId={selectedUser?.id ?? null} onChoose={handleChoose} />

            {selectedUser !== null && (
                <div>
                    <button type="button" onClick={handleClose}>Fechar tasks</button>
                    <UserTasks key={selectedUser.id} user={selectedUser} onCountChange={setTaskCount} />
                </div>
            )}
        </main>
    )
}

export default App
