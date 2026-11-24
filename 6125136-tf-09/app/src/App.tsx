import { useState } from "react";
import { UserList } from "./components/UserList";
import { UserTasks } from "./components/UserTasks";
import type { User } from "./types";

export function App() {
  const [chosenUser, setChosenUser] = useState<User | null>(null);

  const handleChoose = (user: User) => {
    setChosenUser(user);
  };

  return (
    <main>
      <h1>Usuários e Tasks</h1>
      <UserList chosenUser={chosenUser} onChoose={handleChoose} />
      {chosenUser !== null && (
        <UserTasks key={chosenUser.id} user={chosenUser} />
      )}
    </main>
  );
}
