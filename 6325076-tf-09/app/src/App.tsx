import { useEffect, useState } from 'react'
import UserList from './components/UserList'
import UserTasks from './components/UserTasks'
import type { User } from './types'
import './App.css'

function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  function handleChoose(user: User) {
    setSelectedUser(user)
  }

  useEffect(() => {
    if (selectedUser === null) {
      document.title = 'TF-09 · Gerenciador de Tarefas'
    }
  }, [selectedUser])

  return (
    <main className="container">
      <header>
        <h1>Gerenciador de Tarefas</h1>
        <p>TF-09 · Frontend · UNIFAAT 2026.2</p>
      </header>

      <div className="layout">
        <UserList
          onChoose={handleChoose}
          selectedUserId={selectedUser?.id ?? null}
        />

        <section className="tasks">
          {selectedUser ? (
            <UserTasks key={selectedUser.id} user={selectedUser} />
          ) : (
            <p>Selecione um usuário para visualizar suas tarefas.</p>
          )}
        </section>
      </div>

      <footer>
        Desenvolvido por Pablo Augusto · RA 6325076
      </footer>
    </main>
  )
}

export default App
