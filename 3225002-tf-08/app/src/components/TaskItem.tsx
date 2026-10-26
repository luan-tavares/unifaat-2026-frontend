import type { Task } from "../tipos";

type Props = {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

/**
 * Uma linha da lista.
 *
 * Não guarda estado nenhum: recebe a tarefa por prop e avisa o dono do
 * estado pelos callbacks. Dois componentes guardando a mesma verdade é
 * como ela começa a divergir.
 */
export function TaskItem({ task, onToggle, onDelete }: Props) {
  const handleToggle = () => {
    onToggle(task.id);
  };

  const handleDelete = (evento: React.MouseEvent<HTMLButtonElement>) => {
    // O botão está DENTRO da área clicável que alterna a tarefa. Sem
    // parar a propagação, excluir também alternaria no caminho — o
    // efeito some junto com a linha, mas o estado passaria por lá.
    evento.stopPropagation();
    onDelete(task.id);
  };

  return (
    <li className={task.isDone ? "item feita" : "item"}>
      <span className="nome" onClick={handleToggle}>
        <input type="checkbox" checked={task.isDone} readOnly tabIndex={-1} />
        {task.name}
      </span>
      <button type="button" onClick={handleDelete} aria-label={`Excluir ${task.name}`}>
        Excluir
      </button>
    </li>
  );
}
