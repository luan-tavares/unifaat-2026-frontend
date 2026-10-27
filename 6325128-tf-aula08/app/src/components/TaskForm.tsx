import { useState } from "react";

type Props = {
  onAdd: (name: string) => void;
};

export function TaskForm({ onAdd }: Props) {
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (name.trim() === "") {
      return;
    }
    onAdd(name);
    setName("");
  };

  return (
    <div className="task-form">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Digite o nome da task"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleAdd();
          }
        }}
      />
      <button type="button" onClick={handleAdd}>
        Adicionar
      </button>
    </div>
  );
}
