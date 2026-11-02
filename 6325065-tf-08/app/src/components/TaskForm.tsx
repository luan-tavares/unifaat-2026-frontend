import { useState } from "react";
import type { ChangeEvent } from "react";

type Props = {
  onAdd: (name: string) => void;
};

export function TaskForm({ onAdd }: Props) {
  const [name, setName] = useState<string>("");

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }

  function handleAdd() {
    const trimmedName = name.trim();
    if (trimmedName === "") return;
    onAdd(trimmedName);
    setName("");
  }

  return (
    <div>
      <input value={name} onChange={handleChange} placeholder="Nova task" />
      <button type="button" onClick={handleAdd}>
        Adicionar
      </button>
    </div>
  );
}