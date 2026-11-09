
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import useAxios from "../hooks/useAxios";
import clientApi from "../api/clientApi";

interface User {
  id: number;
  name: string;
  email: string;
  job_title: string | null;
}

interface Task {
  id: number;
  name: string;
  is_done: boolean;
  id_user: number;
}

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  next: number | null;
}

interface Props {
  user: User;
  onTasksLoaded: (count: number) => void;
}

function UserTasks({ user, onTasksLoaded }: Props) {
  const [filter, setFilter] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showCount, setShowCount] = useState(false);

  const filterRef = useRef<HTMLInputElement>(null);
  const responseCountRef = useRef(0);

  const { data, error, isLoading, refetch } =
    useAxios<PaginatedResponse<Task>>(
      `/users/${user.id}/tasks?page=1&limit=20`
    );

  useEffect(() => {
    filterRef.current?.focus();
  }, []);

  useEffect(() => {
    if (data !== null) {
      responseCountRef.current += 1;
      onTasksLoaded(data.data.length);
    }
  }, [data, onTasksLoaded]);

  const handleClear = () => {
    setFilter("");
    filterRef.current?.focus();
  };

  const handleShowCount = () => {
    setShowCount((currentValue) => !currentValue);
    console.log("Respostas de tasks:", responseCountRef.current);
  };

  const handleFilterChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
  };

  const handleToggleTask = async (task: Task) => {
    setIsSaving(true);
    setSaveError(null);

    try {
      await clientApi.put(
        `/users/${user.id}/tasks/${task.id}`,
        { is_done: !task.is_done }
      );

      refetch();
    } catch {
      setSaveError("Não foi possível salvar a tarefa.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTaskClick = (task: Task) => {
    handleToggleTask(task);
  };

  if (isLoading) {
    return <p>Carregando tarefas...</p>;
  }

  if (error) {
    return (
      <div>
        <p>Erro ao carregar tarefas: {error}</p>
        <button onClick={refetch}>Tentar de novo</button>
      </div>
    );
  }

  if (!data) {
    return <p>Nenhuma tarefa encontrada.</p>;
  }

  const filteredTasks = data.data.filter((task) =>
    task.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <section>
      <h2>Tarefas de {user.name}</h2>

      <div>
        <input
          ref={filterRef}
          type="text"
          placeholder="Filtrar tarefas pelo nome..."
          value={filter}
          onChange={handleFilterChange}
        />

        <button onClick={handleClear}>Limpar</button>
      </div>

      <button onClick={handleShowCount}>
        {showCount ? "Ocultar" : "Mostrar"} quantidade de respostas
      </button>

      {showCount && (
        <p>Respostas recebidas: {responseCountRef.current}</p>
      )}

      {isSaving && <p>Salvando...</p>}
      {saveError && <p>{saveError}</p>}

      <ul>
        {filteredTasks.map((task) => (
          <li key={task.id}>
            <button
              onClick={() => handleTaskClick(task)}
              disabled={isSaving}
            >
              {task.is_done ? "✅" : "⬜"} {task.name}
            </button>
          </li>
        ))}
      </ul>

      {filteredTasks.length === 0 && (
        <p>Nenhuma tarefa encontrada.</p>
      )}
    </section>
  );
}

export default UserTasks;
