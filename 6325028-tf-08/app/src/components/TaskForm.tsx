import { useState } from "react";

type Props = {
  onAdd: (name: string) => void;
};

export function TaskForm({ onAdd }: Props) {
  const [name, setName] = useState("");

  const handleAdd = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    onAdd(trimmedName);
    setName("");
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Digite uma tarefa"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />

      <button type="button" onClick={handleAdd}>
        Adicionar
      </button>
    </div>
  );
}