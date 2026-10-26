import type { Task } from "../tipos";
import { TaskItem } from "./TaskItem";

type Props = {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

/**
 * A lista já filtrada.
 *
 * Quem filtra é o `App`; aqui só se desenha o que chegou. Se este
 * componente também soubesse do filtro, a regra estaria em dois lugares.
 */
export function TaskList({ tasks, onToggle, onDelete }: Props) {
  // Saída cedo para a lista vazia, em vez de um ternário em volta do
  // `<ul>`: separa os dois desenhos sem precisar de `else`.
  if (tasks.length === 0) {
    return <p className="vazio">Nenhuma task</p>;
  }

  return (
    <ul className="lista">
      {tasks.map((task) => (
        // `key` é o id, nunca o índice: com índice, excluir a primeira
        // tarefa faria o React reaproveitar o estado interno da linha
        // errada para todas as de baixo.
        <TaskItem key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  );
}
