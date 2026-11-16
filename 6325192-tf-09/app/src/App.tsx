import { useEffect, useState } from 'react'
import { UserList } from './components/UserList'
import { UserTasks } from './components/UserTasks'
import type { User } from './types'
export default function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  useEffect(() => {
    if (selectedUser === null) document.title = 'TF09 - Usuarios e Tasks'
  }, [selectedUser])
  function handleSelect(user: User) { setSelectedUser(user) }
  return <main>
    <header><p className="eyebrow">UNIFAAT · Frontend · Aula 09</p><h1>Usuários e Tasks</h1><p>React, TypeScript, referências, efeitos e Axios</p></header>
    <div className="layout">
      <UserList selectedId={selectedUser?.id ?? null} onSelect={handleSelect} />
      {selectedUser === null && <section className="panel empty"><h2>Nenhum usuário selecionado</h2><p>Selecione um usuário na lista ao lado.</p></section>}
      {selectedUser !== null && <UserTasks key={selectedUser.id} user={selectedUser} />}
    </div>
  </main>
}
