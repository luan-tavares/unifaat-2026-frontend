import { useState, useEffect } from 'react'
import { User } from './types'
import UserList from './components/UserList'
import UserTasks from './components/UserTasks'

function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [taskCount, setTaskCount] = useState<number | null>(null)

  useEffect(() => {
    if (selectedUser === null) {
      document.title = 'Usuários e Tasks'
      return
    }
    const count = taskCount !== null ? taskCount : 0
    document.title = `${selectedUser.name} · ${count} tasks`
  }, [selectedUser, taskCount])

  function handleSelectUser(user: User) {
    setSelectedUser(user)
    setTaskCount(null)
  }

  function handleTaskCountChange(total: number) {
    setTaskCount(total)
  }

  return (
    <div>
      <h1>Usuários e Tasks</h1>
      <UserList
        selectedUserId={selectedUser?.id ?? null}
        onSelectUser={handleSelectUser}
      />
      {selectedUser !== null && (
        <UserTasks
          key={selectedUser.id}
          user={selectedUser}
          onTaskCountChange={handleTaskCountChange}
        />
      )}
    </div>
  )
}

export default App
