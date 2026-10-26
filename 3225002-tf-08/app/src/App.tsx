import { useState } from "react";

import type { Filter, Task } from "./tipos";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";
import "./App.css";

/**
 * Qual tarefa cada filtro deixa passar.
 *
 * Um `Record` tipado pela união, e não uma cadeia de `if`: se um valor
 * novo entrar em `Filter`, o compilador exige a entrada aqui. Com `if`
 * o caso novo cairia em silêncio no último ramo.
 */
const PASSA_NO_FILTRO: Record<Filter, (task: Task) => boolean> = {
  all: () => true,
  pending: (task) => !task.isDone,
  done: (task) => task.isDone,
};

const ROTULOS: Record<Filter, string> = {
  all: "Todas",
  pending: "Pendentes",
  done: "Feitas",
};

const FILTROS: Filter[] = ["all", "pending", "done"];

/** Dono do estado. Os filhos recebem dados por props e avisam por callback. */
export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filtro, setFiltro] = useState<Filter>("all");

  const handleAdd = (name: string) => {
    const nova: Task = { id: crypto.randomUUID(), name, isDone: false };
    // Forma de função porque o novo valor depende do anterior, e array
    // novo em vez de `push`: alterar o do estado no lugar não avisaria
    // o React de nada.
    setTasks((atuais) => [...atuais, nova]);
  };

  const handleToggle = (id: string) => {
    setTasks((atuais) =>
      atuais.map((task) =>
        task.id === id ? { ...task, isDone: !task.isDone } : task,
      ),
    );
  };

  const handleDelete = (id: string) => {
    setTasks((atuais) => atuais.filter((task) => task.id !== id));
  };

  // Valores derivados, calculados a cada desenho. Guardar a contagem num
  // segundo estado criaria duas verdades para o mesmo fato, e uma delas
  // ficaria velha na primeira vez que alguém esquecesse de atualizar.
  const visiveis = tasks.filter(PASSA_NO_FILTRO[filtro]);
  const pendentes = tasks.filter(PASSA_NO_FILTRO.pending).length;

  return (
    <main className="app">
      <h1>Tasks</h1>

      <TaskForm onAdd={handleAdd} />

      <div className="filtros">
        {FILTROS.map((opcao) => {
          const handleFiltro = () => {
            setFiltro(opcao);
          };

          return (
            <button
              key={opcao}
              type="button"
              className={opcao === filtro ? "ativo" : ""}
              onClick={handleFiltro}
            >
              {ROTULOS[opcao]}
            </button>
          );
        })}
      </div>

      <TaskList tasks={visiveis} onToggle={handleToggle} onDelete={handleDelete} />

      <p className="contador">
        {pendentes} pendente{pendentes === 1 ? "" : "s"}
      </p>
    </main>
  );
}
