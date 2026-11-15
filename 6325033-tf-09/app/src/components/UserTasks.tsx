import { useEffect, useRef, useState } from "react";
import clientApi from "../api/clientApi";
import useAxios from "../hooks/useAxios";
import type { PaginatedResponse, Task, User } from "../types";

type Props = {
  user: User;
  onTasksLoaded: (count: number) => void;
};

function UserTasks({ user, onTasksLoaded }: Props) {
  const { data, error, isLoading, refetch } =
    useAxios<PaginatedResponse<Task>>(
      `/users/${user.id}/tasks?page=1&limit=20`
    );

  const [filterText, setFilterText] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filterInputRef = useRef<HTMLInputElement>(null);
  const responseCountRef = useRef<number>(0);

  useEffect(() => {
    filterInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (data === null) {
      return;
    }
    responseCountRef.current += 1;
    onTasksLoaded(data.data.length);
  }, [data, onTasksLoaded]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(e.target.value);
  };

  const handleClearFilter = () => {
    setFilterText("");
    filterInputRef.current?.focus();
  };

  const handleShowCount = () => {
    alert(`Respostas recebidas: ${responseCountRef.current}`);
  };

  const handleToggleTask = async (task: Task) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      await clientApi.put(`/users/${user.id}/tasks/${task.id}`, {
        is_done: !task.is_done,
      });
      refetch();
    } catch (err) {
      if (err instanceof Error) {
        setSaveError(err.message);
        return;
      }
      setSaveError("Erro inesperado ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTasks =
    data?.data.filter((task) =>
      task.name.toLowerCase().includes(filterText.toLowerCase())
    ) ?? [];

  if (isLoading) {
    return <p>Carregando...</p>;
  }

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button type="button" onClick={refetch}>
          Tentar de novo
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Tasks de {user.name}</h2>

      <div>
        <input
          ref={filterInputRef}
          type="text"
          value={filterText}
          onChange={handleFilterChange}
          placeholder="Filtrar tasks..."
        />
        <button type="button" onClick={handleClearFilter}>
          Limpar
        </button>
        <button type="button" onClick={handleShowCount}>
          Mostrar
        </button>
      </div>

      {isSaving && <p>Salvando...</p>}
      {saveError && <p>{saveError}</p>}

      <ul>
        {filteredTasks.map((task) => {
          const handleClick = () => handleToggleTask(task);
          return (
            <li key={task.id}>
              <span
                style={{
                  textDecoration: task.is_done ? "line-through" : "none",
                  cursor: "pointer",
                }}
                onClick={handleClick}
              >
                {task.name}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default UserTasks;
