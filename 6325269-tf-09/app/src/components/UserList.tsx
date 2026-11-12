import { useState } from "react";
import { useAxios } from "../hooks/useAxios.ts";
import type { PaginatedResponse, User } from "../types/api.ts";
import ErrorMessage from "./ErrorMessage.tsx";
import UserItem from "./UserItem.tsx";

const LIMIT = 5;

type Props = {
  selectedId: number | null;
  onChoose: (user: User) => void;
};

export default function UserList({ selectedId, onChoose }: Props) {
  const [page, setPage] = useState(1);
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(
    `/users?page=${page}&limit=${LIMIT}`,
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const isPreviousDisabled = isLoading || page === 1;
  const isNextDisabled = isLoading || !data || data.next === null;

  function handlePrevious() {
    setPage((current) => Math.max(1, current - 1));
  }

  function handleNext() {
    setPage((current) => current + 1);
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

    if (data.data.length === 0) {
      return <p className="status">Nenhum usuário</p>;
    }

    return (
      <ul className="users">
        {data.data.map((user) => (
          <UserItem
            key={user.id}
            user={user}
            isSelected={user.id === selectedId}
            onChoose={onChoose}
          />
        ))}
      </ul>
    );
  }

  return (
    <section className="panel">
      <h2>Usuários</h2>

      {renderContent()}

      <div className="pagination">
        <button type="button" onClick={handlePrevious} disabled={isPreviousDisabled}>
          Anterior
        </button>
        <span>
          Página {page} de {totalPages}
        </span>
        <button type="button" onClick={handleNext} disabled={isNextDisabled}>
          Próxima
        </button>
      </div>
    </section>
  );
}
