import { useCallback, useEffect, useRef, useState } from 'react'
import UserList from './components/UserList'
import UserTasks from './components/UserTasks'
import type { Task, User, PaginatedResponse } from './types'
import './App.css'

const DEFAULT_TITLE = 'TF-09 · Usuários e tarefas'

function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [tasksResponse, setTasksResponse] =
    useState<PaginatedResponse<Task> | null>(null)
  const tasksResponsesCount = useRef<number>(0)

  const handleChooseUser = (user: User) => {
    if (selectedUser?.id === user.id) return

    setSelectedUser(user)
    setTasksResponse(null)
  }

  const handleTasksLoaded = useCallback(
    (userId: number, response: PaginatedResponse<Task>) => {
      if (selectedUser?.id !== userId) return
      setTasksResponse(response)
    },
    [selectedUser?.id],
  )

  const handleShowResponses = () => {
    console.log(`Respostas de tasks recebidas: ${tasksResponsesCount.current}`)
  }

  useEffect(() => {
    if (tasksResponse === null) return
    tasksResponsesCount.current += 1
  }, [tasksResponse])

  useEffect(() => {
    if (selectedUser === null) {
      document.title = DEFAULT_TITLE
      return
    }

    const taskCount = tasksResponse?.total ?? 0
    const taskLabel = taskCount === 1 ? 'task' : 'tasks'
    document.title = `${selectedUser.name} · ${taskCount} ${taskLabel}`
  }, [selectedUser, tasksResponse])

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">UNIFAAT · FRONTEND · TF-09</p>
          <h1>Usuários e tarefas</h1>
          <p className="intro">
            Escolha uma pessoa para consultar e atualizar suas tarefas.
          </p>
        </div>
        <button
          className="secondary-button response-button"
          type="button"
          onClick={handleShowResponses}
        >
          Mostrar
        </button>
      </header>

      <div className="content-grid">
        <UserList
          selectedUserId={selectedUser?.id ?? null}
          onChooseUser={handleChooseUser}
        />
        <UserTasks
          key={selectedUser?.id ?? 'no-user'}
          user={selectedUser}
          onTasksLoaded={handleTasksLoaded}
        />
      </div>
    </main>
  )
}

export default App
