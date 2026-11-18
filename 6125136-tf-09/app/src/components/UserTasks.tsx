import { useEffect, useRef, useState } from "react";
import { clientApi } from "../api/clientApi";
import { useAxios } from "../hooks/useAxios";
import type { PaginatedResponse, Task, User } from "../types";

type Props = {
  user: User;
};

const DEFAULT_TITLE = "TF09 - Usuários e Tasks";

export function UserTasks({ user }: Props) {
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<Task>>(
    `/users/${user.id}/tasks?page=1&limit=20`,
  );
  const [filterText, setFilterText] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const responsesCountRef = useRef<number>(0);

  useEffect(() => {
    filterRef.current?.focus();
  }, []);

  useEffect(() => {
    if (data === null) {
      return;
    }
    responsesCountRef.current += 1;
  }, [data]);

  const total = data === null ? null : data.total;

  useEffect(() => {
    document.title =
      total === null ? user.name : `${user.name} · ${total} tasks`;

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [user.name, total]);

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(event.target.value);
  };

  const handleClear = () => {
    setFilterText("");
    filterRef.current?.focus();
  };

  const handleShowCount = () => {
    console.log(`Respostas de tasks recebidas: ${responsesCountRef.current}`);
  };

  const handleRetry = () => {
    refetch();
  };

  const toggleTask = async (task: Task) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      await clientApi.put(`/users/${user.id}/tasks/${task.id}`, {
        is_done: !task.is_done,
      });
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar");
    }

    setIsSaving(false);
  };

  const normalizedFilter = filterText.trim().toLowerCase();
  const visibleTasks =
    data === null
      ? []
      : data.data.filter((task) =>
          task.name.toLowerCase().includes(normalizedFilter),
        );

  return (
    <section>
      <h2>Tasks de {user.name}</h2>
      <input
        ref={filterRef}
        type="text"
        value={filterText}
        onChange={handleFilterChange}
        placeholder="Filtrar por nome..."
      />{" "}
      <button type="button" onClick={handleClear}>
        Limpar
      </button>{" "}
      <button type="button" onClick={handleShowCount}>
        Mostrar
      </button>
      {isLoading && <p>Carregando...</p>}
      {isSaving && <p>Salvando...</p>}
      {saveError !== null && <p>Erro ao salvar: {saveError}</p>}
      {error !== null && (
        <p>
          {error} <button type="button" onClick={handleRetry}>Tentar de novo</button>
        </p>
      )}
      {data !== null && (
        <ul>
          {visibleTasks.map((task) => {
            const handleToggle = () => {
              toggleTask(task);
            };

            return (
              <li
                key={task.id}
                onClick={handleToggle}
                style={{
                  cursor: "pointer",
                  textDecoration: task.is_done ? "line-through" : "none",
                }}
              >
                {task.name}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
