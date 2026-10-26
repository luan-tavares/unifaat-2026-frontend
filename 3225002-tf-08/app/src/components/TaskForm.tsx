import { useState } from "react";

type Props = {
  onAdd: (name: string) => void;
};

/**
 * Campo controlado para digitar o nome da tarefa.
 *
 * O texto em digitação é estado DESTE componente, não do `App`: ninguém
 * mais precisa dele. O `App` só é avisado quando a tarefa é criada, pelo
 * callback `onAdd`.
 */
export function TaskForm({ onAdd }: Props) {
  const [name, setName] = useState<string>("");

  const handleChange = (evento: React.ChangeEvent<HTMLInputElement>) => {
    setName(evento.target.value);
  };

  const handleAdd = () => {
    // `trim` para que só espaços não contem como nome. Saída cedo em vez
    // de `if/else`: o caminho inválido termina aqui.
    const limpo = name.trim();

    if (limpo.length === 0) {
      return;
    }

    onAdd(limpo);
    setName("");
  };

  // Enter adiciona, como se espera de um campo de texto com botão.
  const handleKeyDown = (evento: React.KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <div className="form">
      <input
        type="text"
        value={name}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="O que precisa ser feito?"
        aria-label="Nome da tarefa"
      />
      <button type="button" onClick={handleAdd}>
        Adicionar
      </button>
    </div>
  );
}
