import { useCallback, useEffect, useState } from 'react'
import { UserList } from './components/UserList'
import { UserTasks } from './components/UserTasks'
import type { User } from './types'

const DEFAULT_TITLE = 'Usuários e tarefas'

const App = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [taskCount, setTaskCount] = useState(0)

  useEffect(() => {
    document.title = selectedUser === null
      ? DEFAULT_TITLE
      : `${selectedUser.name} · ${taskCount} tasks`
  }, [selectedUser, taskCount])

  function handleChooseUser(user: User): void {
    setSelectedUser(user)
    setTaskCount(0)
  }

  const handleTasksCountChange = useCallback((count: number): void => {
    setTaskCount(count)
  }, [])

  return (
    <main className="app-shell">
      <header className="hero">
        <div className="hero-content">
          <p className="eyebrow">UNIFAAT · FRONTEND 2026.2</p>
          <h1>Usuários <span>&</span> tarefas</h1>
          <p className="hero-description">
            Selecione um usuário para consultar e atualizar suas tarefas.
          </p>
        </div>
        <div className="hero-mark" aria-hidden="true">09</div>
      </header>

      <div className="content-grid">
        <UserList
          onChoose={handleChooseUser}
          selectedUserId={selectedUser?.id ?? null}
        />

        {selectedUser !== null && (
          <UserTasks
            key={selectedUser.id}
            user={selectedUser}
            onTasksCountChange={handleTasksCountChange}
          />
        )}

        {selectedUser === null && (
          <section className="panel welcome-panel">
            <div className="welcome-icon">↖</div>
            <p className="eyebrow">COMECE POR AQUI</p>
            <h2>Escolha um usuário</h2>
            <p>As tarefas da pessoa selecionada aparecerão nesta área.</p>
          </section>
        )}
      </div>

      <footer className="app-footer">TF-09 · React, referências e efeitos</footer>
    </main>
  )
}

export default App
