import { useState } from "react";
import { useAxios } from "../hooks/useAxios";
import type { PaginatedResponse, User } from "../types";

type Props = {
  chosenUser: User | null;
  onChoose: (user: User) => void;
};

export function UserList({ chosenUser, onChoose }: Props) {
  const [page, setPage] = useState<number>(1);
  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(
    `/users?page=${page}&limit=5`,
  );

  const handlePrevious = () => {
    setPage((previousPage) => previousPage - 1);
  };

  const handleNext = () => {
    setPage((previousPage) => previousPage + 1);
  };

  const handleRetry = () => {
    refetch();
  };

  const isFirstPage = page === 1;
  const isLastPage = data === null || data.next === null;

  return (
    <section>
      <h2>Usuários</h2>
      {isLoading && <p>Carregando...</p>}
      {error !== null && (
        <p>
          {error} <button type="button" onClick={handleRetry}>Tentar de novo</button>
        </p>
      )}
      {data !== null && (
        <ul>
          {data.data.map((user) => {
            const isChosen = chosenUser?.id === user.id;
            const handleChoose = () => onChoose(user);

            return (
              <li key={user.id}>
                <button
                  type="button"
                  onClick={handleChoose}
                  style={{ fontWeight: isChosen ? "bold" : "normal" }}
                >
                  {user.name}
                </button>{" "}
                <small>{user.job_title ?? "sem cargo"}</small>
              </li>
            );
          })}
        </ul>
      )}
      <button type="button" onClick={handlePrevious} disabled={isFirstPage}>
        Anterior
      </button>{" "}
      <span>Página {page}</span>{" "}
      <button type="button" onClick={handleNext} disabled={isLastPage}>
        Próxima
      </button>
    </section>
  );
}
