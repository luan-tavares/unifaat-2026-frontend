import { useCallback, useRef, useState } from "react"
import { UserList } from "./components/UserList"
import { UserTasks } from "./components/UserTasks"
import type { User } from "./types/api"

export function App() {
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    // Bastidor: conta as respostas de tasks sem renderizar a tela
    const responsesRef = useRef(0)
    const outputRef = useRef<HTMLSpanElement>(null)

    const selectedId = selectedUser === null ? null : selectedUser.id

    function handleChoose(user: User) {
        setSelectedUser(user)
    }

    function handleUnselect() {
        setSelectedUser(null)
    }

    // Referência estável: entra na lista de dependências do efeito do UserTasks
    const handleTasksReceived = useCallback(() => {
        responsesRef.current += 1
    }, [])

    function handleShow() {
        const message = `Respostas de tasks recebidas: ${responsesRef.current}`
        console.log(message)
        if (outputRef.current === null) return
        outputRef.current.textContent = message
    }

    return (
        <main className="app">
            <header className="app-header">
                <h1>Usuários e Tasks</h1>
                <div className="backstage">
                    <button onClick={handleShow}>Mostrar</button>
                    <span ref={outputRef} className="muted" />
                </div>
            </header>

            <div className="columns">
                <UserList selectedId={selectedId} onChoose={handleChoose} />

                <div>
                    {selectedUser !== null && (
                        <button className="link" onClick={handleUnselect}>Fechar usuário</button>
                    )}
                    <UserTasks
                        key={selectedId ?? 0}
                        user={selectedUser}
                        onTasksReceived={handleTasksReceived}
                    />
                </div>
            </div>
        </main>
    )
}
