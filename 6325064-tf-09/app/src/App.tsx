
import { useCallback, useEffect, useState } from "react";
import UserList from "./components/UserList";
import UserTasks from "./components/UserTasks";

interface User {
  id: number;
  name: string;
  email: string;
  job_title: string | null;
}

function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [taskCount, setTaskCount] = useState(0);

  const handleChoose = (user: User) => {
    setSelectedUser(user);
    setTaskCount(0);
  };

  const handleTasksLoaded = useCallback((count: number) => {
    setTaskCount(count);
  }, []);

  useEffect(() => {
    if (selectedUser === null) {
      document.title = "Lista de usuários e tarefas";
      return;
    }

    document.title = `${selectedUser.name} · ${taskCount} tasks`;
  }, [selectedUser, taskCount]);

  return (
    <main className="container">
      <header>
        <h1>Gerenciador de Tarefas</h1>
        <p>Selecione um usuário para visualizar suas tarefas.</p>
      </header>

      <div className="content">
        <UserList
          onChoose={handleChoose}
          selectedUserId={selectedUser?.id ?? null}
        />

        <section className="tasks">
          {selectedUser !== null ? (
            <UserTasks
              key={selectedUser.id}
              user={selectedUser}
              onTasksLoaded={handleTasksLoaded}
            />
          ) : (
            <p>Escolha um usuário para ver suas tarefas.</p>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
