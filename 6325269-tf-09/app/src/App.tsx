import { useRef, useState } from "react";
import type { User } from "./types/api.ts";
import UserList from "./components/UserList.tsx";
import UserTasks from "./components/UserTasks.tsx";
import "./App.css";

export default function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  // Quantas respostas de tasks o app já recebeu: não vai para a tela
  const tasksResponsesRef = useRef(0);

  function handleChoose(user: User) {
    setSelectedUser(user);
  }

  function handleClose() {
    setSelectedUser(null);
  }

  function handleShowResponses() {
    console.log(`Respostas de tasks recebidas: ${tasksResponsesRef.current}`);
  }

  return (
    <main className="app">
      {/* Decoração: minha foto à esquerda e E.T. à direita, flutuando */}
      <div className="character character--left" aria-hidden="true" />
      <div className="character character--right" aria-hidden="true" />

      <header className="app-header">
        <h1>Usuários e tasks</h1>
        <button type="button" onClick={handleShowResponses}>
          Mostrar
        </button>
      </header>

      <div className="layout">
        <UserList selectedId={selectedUser?.id ?? null} onChoose={handleChoose} />

        {selectedUser ? (
          <UserTasks
            key={selectedUser.id}
            user={selectedUser}
            responsesRef={tasksResponsesRef}
            onClose={handleClose}
          />
        ) : (
          <section className="panel">
            <p className="status">Escolha um usuário para ver as tasks.</p>
          </section>
        )}
      </div>
    </main>
  );
}
