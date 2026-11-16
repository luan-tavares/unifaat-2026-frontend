
import { useState } from 'react'
import UserList from './components/UserList'
import UserTasks from './components/UserTasks'
import type { User } from './types'

const App = (): React.JSX.Element => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleChooseUser = (user: User): void => {
    setSelectedUser(user)
  }

  return (
    <main>
      <h1>Gerenciador de Usuários e Tasks</h1>

      <UserList
        onChoose={handleChooseUser}
        selectedUserId={selectedUser?.id ?? null}
      />

      {selectedUser !== null && (
        <UserTasks
          key={selectedUser.id}
          user={selectedUser}
        />
      )}
    </main>
  )
}

export default App
