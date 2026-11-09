import { useState } from "react";

import { useAxios } from "../hooks/useAxios";
import type { PaginatedResponse, User } from "../tipos";

type Props = {
  escolhido: User | null;
  onEscolher: (user: User) => void;
};

export function UserList({ escolhido, onEscolher }: Props) {
  // `page` é estado: mudá-lo muda a url, e a url muda as dependências do
  // efeito dentro do hook. É o estado que dispara a busca, não um
  // `refetch` manual.
  const [page, setPage] = useState<number>(1);

  const { data, error, isLoading, refetch } = useAxios<PaginatedResponse<User>>(
    `/users?page=${page}&limit=5`,
  );

  const handleAnterior = () => setPage((atual) => Math.max(1, atual - 1));
  const handleProxima = () => setPage((atual) => atual + 1);

  // Saída cedo em vez de `else`: cada estado da tela termina aqui.
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

  // A lista só aparece quando há dados.
  if (data === null) {
    return null;
  }

  return (
    <section className="painel">
      <h2>Usuários</h2>

      <ul className="lista">
        {data.data.map((user) => {
          const handleEscolher = () => onEscolher(user);

          return (
            // `key` é o id, nunca o índice: com índice, mudar de página
            // faria o React reaproveitar o estado da linha errada.
            <li key={user.id}>
              <button
                type="button"
                className={user.id === escolhido?.id ? "item ativo" : "item"}
                onClick={handleEscolher}
              >
                <strong>{user.name}</strong>
                <span>{user.job_title ?? "sem cargo"}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="paginacao">
        <button type="button" onClick={handleAnterior} disabled={page === 1}>
          Anterior
        </button>
        <span>
          página {data.page} · {data.total} no total
        </span>
        <button type="button" onClick={handleProxima} disabled={data.next === null}>
          Próxima
        </button>
      </div>
    </section>
  );
}
