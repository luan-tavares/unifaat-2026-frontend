import { useRef, useState } from "react"
import UserList from "./components/UserList"
import UserTasks from "./components/UserTasks"
import type { User } from "./types/api"

export default function App() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [responsesText, setResponsesText] = useState("")
    // Dado de bastidor: quantas respostas de tasks o app já recebeu (não renderiza a tela)
    const responsesRef = useRef(0)

    function handleChoose(user: User) {
        setSelectedUser(user)
    }

    function handleTasksReceived() {
        responsesRef.current += 1
    }

    function handleShowResponses() {
        const text = `Respostas de tasks recebidas: ${responsesRef.current}`
        console.log(text)
        setResponsesText(text)
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
                {selectedUser !== null && (
                    <UserTasks
                        key={selectedUser.id}
                        user={selectedUser}
                        onTasksReceived={handleTasksReceived}
                    />
                )}
            </div>
            <div className="backstage">
                <button type="button" onClick={handleShowResponses}>Mostrar</button>
                {responsesText !== "" && <span>{responsesText}</span>}
            </div>
        </main>
    )
}
