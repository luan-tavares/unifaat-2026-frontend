import { useState } from "react";
import useAxios from "../hooks/useAxios";
import type { PaginatedResponse, User } from "../types";

type Props = {
  selectedUserId: number | null;
  onSelectUser: (user: User) => void;
};

function UserList({ selectedUserId, onSelectUser }: Props) {
  const [page, setPage] = useState<number>(1);

  const { data, error, isLoading, refetch } =
    useAxios<PaginatedResponse<User>>(`/users?page=${page}&limit=10`);

  const handlePrevPage = () => setPage((prev) => prev - 1);
  const handleNextPage = () => setPage((prev) => prev + 1);

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
      <ul>
        {data?.data.map((user) => {
          const handleSelectUser = () => onSelectUser(user);
          return (
            <li
              key={user.id}
              onClick={handleSelectUser}
              style={{
                fontWeight: user.id === selectedUserId ? "bold" : "normal",
                cursor: "pointer",
              }}
            >
              {user.name} — {user.email}
            </li>
          );
        })}
      </ul>

      <div>
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={page <= 1 || isLoading}
        >
          Anterior
        </button>
        <span> Página {page} </span>
        <button
          type="button"
          onClick={handleNextPage}
          disabled={data?.next === null || isLoading}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}

export default UserList;
