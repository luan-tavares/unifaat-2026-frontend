import { useState, useEffect } from 'react'
import UserList from './components/UserList'
import UserTasks from './components/UserTasks'
import { User } from './types'
import './App.css'

function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [taskTotal, setTaskTotal] = useState<number | null>(null)

  // Sincroniza o título da aba com o usuário escolhido e o total de tasks
  useEffect(() => {
    if (!selectedUser) {
      document.title = 'TF-09 · Usuários'
      return
    }

    if (taskTotal === null) {
      document.title = `${selectedUser.name} · carregando tasks...`
      return
    }

    document.title = `${selectedUser.name} · ${taskTotal} tasks`
  }, [selectedUser, taskTotal])

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setTaskTotal(null)
  }

  const handleTasksLoaded = (total: number) => {
    setTaskTotal(total)
  }

  return (
    <div style={{ display: 'flex', gap: '24px', padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ width: '280px', flexShrink: 0 }}>
        <UserList selectedUser={selectedUser} onSelectUser={handleSelectUser} />
      </div>
      <div style={{ flex: 1 }}>
        {selectedUser ? (
          <UserTasks
            key={selectedUser.id}
            user={selectedUser}
            onTasksLoaded={handleTasksLoaded}
          />
        ) : (
          <p>Selecione um usuário para ver suas tasks.</p>
        )}
      </div>
    </div>
  )
}

export default App
