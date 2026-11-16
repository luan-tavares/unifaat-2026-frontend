import { useState } from 'react'
import UserList from './components/UserList'
import UserTasks from './components/UserTasks'
import type { User } from './types'

export default function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  function handleChoose(user: User) {
    setSelectedUser(user)
  }

  return (
    <main className="app">
      <header>
        <p className="eyebrow">TF 09 · React</p>
        <h1>Usuários e tasks</h1>
      </header>

      <div className="columns">
        <UserList selectedId={selectedUser?.id ?? null} onChoose={handleChoose} />

        <section aria-label="Tasks do usuário">
          {selectedUser === null && <p className="muted">Escolha um usuário para ver as tasks.</p>}
          {selectedUser !== null && <UserTasks key={selectedUser.id} user={selectedUser} />}
        </section>
      </div>
    </main>
  )
}
