import { useState } from 'react'
import { UserList } from './components/UserList'
import { UserTasks } from './components/UserTasks'
import { User } from './types'
import './App.css'

function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Gerenciador de Usuários e Tasks</h1>
      
      <div style={{ display: 'flex', gap: '40px' }}>
        <div style={{ flex: 1 }}>
          <UserList onUserSelect={handleUserSelect} />
        </div>

        <div style={{ flex: 1 }}>
          {selectedUser ? (
            <UserTasks key={selectedUser.id} user={selectedUser} />
          ) : (
            <p>Selecione um usuário para ver suas tasks</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
