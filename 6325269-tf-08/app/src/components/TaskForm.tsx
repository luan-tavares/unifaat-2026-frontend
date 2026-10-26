import { useState } from "react";
import type { ChangeEvent } from "react";

type Props = {
  onAdd: (name: string) => void;
};

export default function TaskForm({ onAdd }: Props) {
  const [name, setName] = useState("");

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  function handleAdd() {
    const trimmedName = name.trim();

    if (trimmedName === "") {
      return;
    }

    onAdd(trimmedName);
    setName("");
  }

  return (
    <div className="task-form">
      <input
        type="text"
        placeholder="Nome da task"
        value={name}
        onChange={handleChange}
      />
      <button type="button" onClick={handleAdd}>
        Adicionar
      </button>
    </div>
  );
}
