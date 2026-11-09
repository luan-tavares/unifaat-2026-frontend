
import { useState } from "react";
import useAxios from "../hooks/useAxios";

interface User {
  id: number;
  name: string;
  email: string;
  job_title: string | null;
}

interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  next: number | null;
}

interface Props {
  onChoose: (user: User) => void;
  selectedUserId: number | null;
}

function UserList({ onChoose, selectedUserId }: Props) {
  const [page, setPage] = useState(1);

  const { data, error, isLoading, refetch } =
    useAxios<PaginatedResponse<User>>(`/users?page=${page}&limit=5`);

  const handlePrevious = () => {
    setPage((currentPage) => currentPage - 1);
  };

  const handleNext = () => {
    setPage((currentPage) => currentPage + 1);
  };

  const handleChoose = (user: User) => {
    onChoose(user);
  };

  if (isLoading) {
    return <p>Carregando usuários...</p>;
  }

  if (error) {
    return (
      <div>
        <p>Erro ao carregar usuários: {error}</p>
        <button onClick={refetch}>Tentar de novo</button>
      </div>
    );
  }

  if (!data) {
    return <p>Nenhum usuário encontrado.</p>;
  }

  return (
    <section>
      <h2>Usuários</h2>

      <ul>
        {data.data.map((user) => (
          <li key={user.id}>
            <button
              onClick={() => handleChoose(user)}
              disabled={selectedUserId === user.id}
            >
              {user.name} - {user.email}
            </button>
          </li>
        ))}
      </ul>

      <div>
        <button onClick={handlePrevious} disabled={page === 1}>
          Anterior
        </button>

        <span> Página {data.page} </span>

        <button onClick={handleNext} disabled={data.next === null}>
          Próxima
        </button>
      </div>
    </section>
  );
}

export default UserList;
