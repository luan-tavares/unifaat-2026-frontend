
import { useState } from "react";

type Props = {
  onAddTask: (name: string) => void;
};

function TaskForm({ onAddTask }: Props) {
  const [name, setName] = useState("");

  const handleAdd = () => {
    const trimmedName = name.trim();

    if (trimmedName === "") {
      return;
    }

    onAddTask(trimmedName);
    setName("");
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleAdd();
      }}
    >
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Digite uma tarefa"
      />

      <button type="submit">Adicionar</button>
    </form>
  );
}

export default TaskForm;
