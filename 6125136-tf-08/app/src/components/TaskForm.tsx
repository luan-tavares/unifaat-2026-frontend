import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

type Props = {
  onAdd: (name: string) => void;
};

export function TaskForm({ onAdd }: Props) {
  const [name, setName] = useState<string>("");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const isEmpty = trimmedName === "";

    if (isEmpty) {
      return;
    }

    onAdd(trimmedName);
    setName("");
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={handleChange}
        placeholder="Nova task..."
        aria-label="Nome da task"
      />
      <button type="submit">Adicionar</button>
    </form>
  );
}
