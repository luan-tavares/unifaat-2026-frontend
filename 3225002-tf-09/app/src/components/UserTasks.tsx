import { useEffect, useRef, useState } from "react";

import { clientApi } from "../api/clientApi";
import { useAxios } from "../hooks/useAxios";
import type { PaginatedResponse, Task, User } from "../tipos";

type Props = {
  user: User;
  onTotal: (total: number) => void;
};

export function UserTasks({ user, onTotal }: Props) {
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(
    `/users/${user.id}/tasks?page=1&limit=20`,
  );

  const [filtro, setFiltro] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [erroAoSalvar, setErroAoSalvar] = useState<string | null>(null);

  const campoFiltro = useRef<HTMLInputElement>(null);

  // Dado de bastidor: quantas respostas de tasks já chegaram. Em `ref`
  // porque mudá-lo NÃO deve redesenhar a tela — em estado, cada resposta
  // forçaria um render a mais sem nada novo para mostrar.
  const respostasRecebidas = useRef<number>(0);

  // Foco ao montar. `[]` porque é uma vez só, na entrada da tela.
  useEffect(() => {
    campoFiltro.current?.focus();
  }, []);

  // Conta a resposta e avisa o pai do total. `ref.current` alterado
  // dentro do efeito, nunca durante a renderização.
  useEffect(() => {
    if (data === null) {
      return;
    }

    respostasRecebidas.current += 1;
    onTotal(data.total);
  }, [data, onTotal]);

  const handleLimpar = () => {
    setFiltro("");
    // Devolve o foco: quem limpou quer digitar de novo, e obrigar a
    // clicar no campo outra vez é atrito sem motivo.
    campoFiltro.current?.focus();
  };

  const handleFiltro = (evento: React.ChangeEvent<HTMLInputElement>) => {
    setFiltro(evento.target.value);
  };

  const handleMostrarContagem = () => {
    console.log(`respostas de tasks recebidas: ${respostasRecebidas.current}`);
  };

  /**
   * Alterna a task. Em HANDLER, nunca em efeito: é consequência do
   * clique, não de uma mudança de estado — num efeito rodaria também
   * quando a lista fosse recarregada por outro motivo.
   */
  const marcar = (task: Task) => async () => {
    setIsSaving(true);
    setErroAoSalvar(null);

    try {
      await clientApi.put<Task>(`/users/${user.id}/tasks/${task.id}`, {
        is_done: !task.is_done,
      });
      // Recarrega depois do PUT terminar, para a lista refletir o servidor
      // em vez de um palpite local.
      refetch();
    } catch {
      setErroAoSalvar("Não foi possível salvar a task");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="aviso">Carregando...</p>;
  }

  if (error !== null) {
    return (
      <div className="aviso erro">
        <p>{error}</p>
        <button type="button" onClick={refetch}>
          Tentar de novo
        </button>
      </div>
    );
  }

  if (data === null) {
    return null;
  }

  // Filtro local, sem chamar a API. Valor derivado: calculado a cada
  // render, sem um segundo estado que ficaria velho.
  const visiveis = data.data.filter((task) =>
    task.name.toLowerCase().includes(filtro.trim().toLowerCase()),
  );

  return (
    <section className="painel">
      <h2>
        Tasks de {user.name} <span className="leve">· {data.total}</span>
      </h2>

      <div className="form">
        <input
          ref={campoFiltro}
          type="text"
          value={filtro}
          onChange={handleFiltro}
          placeholder="Filtrar por nome"
          aria-label="Filtrar tasks por nome"
        />
        <button type="button" onClick={handleLimpar}>
          Limpar
        </button>
        <button type="button" onClick={handleMostrarContagem}>
          Mostrar
        </button>
      </div>

      {isSaving ? <p className="aviso">Salvando...</p> : null}
      {erroAoSalvar !== null ? <p className="aviso erro">{erroAoSalvar}</p> : null}

      {visiveis.length === 0 ? (
        <p className="aviso">Nenhuma task</p>
      ) : (
        <ul className="lista">
          {visiveis.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                className={task.is_done ? "item feita" : "item"}
                onClick={marcar(task)}
                disabled={isSaving}
              >
                <input type="checkbox" checked={task.is_done} readOnly tabIndex={-1} />
                {task.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
