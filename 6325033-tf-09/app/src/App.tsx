import { useEffect, useState } from "react";
import UserList from "./components/UserList";
import UserTasks from "./components/UserTasks";
import type { User } from "./types";

function App() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tasksCount, setTasksCount] = useState<number>(0);

  useEffect(() => {
    if (selectedUser === null) {
      document.title = "Gerenciador de Tasks";
      return;
    }
    document.title = `${selectedUser.name} · ${tasksCount} tasks`;
  }, [selectedUser, tasksCount]);

  return (
    <div>
      <UserList
        selectedUserId={selectedUser?.id ?? null}
        onSelectUser={setSelectedUser}
      />
      {selectedUser !== null && (
        <UserTasks
          key={selectedUser.id}
          user={selectedUser}
          onTasksLoaded={setTasksCount}
        />
      )}
    </div>
  );
}

export default App;
