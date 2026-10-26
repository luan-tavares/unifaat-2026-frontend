import { useState } from "react";

type Props = {
  onAdd: (name: string) => void;
};

function TaskForm({ onAdd }: Props) {
  const [name, setName] = useState<string>("");

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleAdd = () => {
    onAdd(name);
    setName("");
  };

  return (
    <div className="task-form">
      <input
        type="text"
        className="task-input"
        placeholder="Nome da task"
        value={name}
        onChange={handleChange}
      />
      <button type="button" className="btn-add" onClick={handleAdd}>
        Adicionar
      </button>
    </div>
  );
}

export default TaskForm;
