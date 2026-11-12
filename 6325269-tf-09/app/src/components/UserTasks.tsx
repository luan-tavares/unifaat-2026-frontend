import { useEffect, useState, type RefObject } from "react";
import clientApi from "../api/clientApi.ts";
import { useAxios } from "../hooks/useAxios.ts";
import type { PaginatedResponse, Task, User } from "../types/api.ts";
import { getErrorMessage } from "../utils/getErrorMessage.ts";
import ErrorMessage from "./ErrorMessage.tsx";
import TaskFilter from "./TaskFilter.tsx";
import TaskItem from "./TaskItem.tsx";

const DEFAULT_TITLE = "Usuários e tasks";

type Props = {
  user: User;
  responsesRef: RefObject<number>;
  onClose: () => void;
};

export default function UserTasks({ user, responsesRef, onClose }: Props) {
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(
    `/users/${user.id}/tasks?page=1&limit=20`,
  );
  const [filter, setFilter] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const total = data?.total ?? null;

  // Dado de bastidor: conta as respostas sem renderizar a tela
  useEffect(() => {
    if (data === null) return;
    responsesRef.current += 1;
  }, [data, responsesRef]);

  // Título da aba acompanha o usuário escolhido; a limpeza volta ao padrão
  useEffect(() => {
    document.title = total === null ? user.name : `${user.name} · ${total} tasks`;

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [user.name, total]);

  // O PUT fica no handler (é uma ação do usuário), nunca num efeito
  async function handleToggle(task: Task) {
    setIsSaving(true);
    setSaveError("");

    try {
      await clientApi.put<Task>(`/users/${user.id}/tasks/${task.id}`, {
        is_done: !task.is_done,
      });
      refetch();
    } catch (err) {
      setSaveError(getErrorMessage(err, "Erro ao salvar a task"));
    }

    setIsSaving(false);
  }

  function handleClose() {
    onClose();
  }

  function renderContent() {
    if (isLoading) {
      return <p className="status">Carregando...</p>;
    }

    if (error) {
      return <ErrorMessage message={error} onRetry={refetch} />;
    }

    if (!data) {
      return null;
    }

    const term = filter.trim().toLowerCase();
    const visibleTasks = data.data.filter((task) => task.name.toLowerCase().includes(term));

    if (visibleTasks.length === 0) {
      return <p className="status">Nenhuma task</p>;
    }

    return (
      <ul className="tasks">
        {visibleTasks.map((task) => (
          <TaskItem key={task.id} task={task} isDisabled={isSaving} onToggle={handleToggle} />
        ))}
      </ul>
    );
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <div>
          <h2>Tasks de {user.name}</h2>
          <p className="muted">{user.email}</p>
        </div>
        <button type="button" onClick={handleClose}>
          Fechar
        </button>
      </header>

      <TaskFilter value={filter} onChange={setFilter} />

      {isSaving && <p className="status">Salvando...</p>}
      {saveError && (
        <p className="error" role="alert">
          {saveError}
        </p>
      )}

      {renderContent()}
    </section>
  );
}
