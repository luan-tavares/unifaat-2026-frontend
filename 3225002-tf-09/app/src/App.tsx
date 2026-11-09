import { useCallback, useEffect, useState } from "react";

import { UserList } from "./components/UserList";
import { UserTasks } from "./components/UserTasks";
import type { User } from "./tipos";
import "./App.css";

const TITULO_PADRAO = "Usuários e tasks";

/** Dono do usuário escolhido. Os filhos recebem props e avisam por callback. */
export function App() {
  const [escolhido, setEscolhido] = useState<User | null>(null);
  const [totalDeTasks, setTotalDeTasks] = useState<number | null>(null);

  // `useCallback` porque esta função entra nas dependências de um efeito
  // do filho. Recriada a cada render, o efeito lá rodaria sempre.
  const handleTotal = useCallback((total: number) => setTotalDeTasks(total), []);

  const handleEscolher = (user: User) => {
    setEscolhido(user);
    // Zera o total: o do usuário anterior não vale para o novo, e deixá-lo
    // mostraria o número errado no título até a resposta chegar.
    setTotalDeTasks(null);
  };

  const handleLimparEscolha = () => {
    setEscolhido(null);
    setTotalDeTasks(null);
  };

  // Sincroniza o título da aba. A limpeza devolve o título padrão: sem
  // ela, o nome do último usuário ficaria na aba depois de desmontar.
  useEffect(() => {
    if (escolhido === null) {
      document.title = TITULO_PADRAO;
      return;
    }

    const sufixo = totalDeTasks === null ? "carregando" : `${totalDeTasks} tasks`;
    document.title = `${escolhido.name} · ${sufixo}`;

    return () => {
      document.title = TITULO_PADRAO;
    };
  }, [escolhido, totalDeTasks]);

  return (
    <main className="app">
      <header>
        <h1>Usuários e tasks</h1>
        {escolhido !== null ? (
          <button type="button" onClick={handleLimparEscolha}>
            Limpar escolha
          </button>
        ) : null}
      </header>

      <div className="colunas">
        <UserList escolhido={escolhido} onEscolher={handleEscolher} />

        {escolhido === null ? (
          <p className="aviso">Escolha um usuário para ver as tasks.</p>
        ) : (
          // `key` remonta o componente ao trocar de usuário: o estado do
          // filtro e o contador de bastidor começam limpos, em vez de
          // carregarem o do usuário anterior.
          <UserTasks key={escolhido.id} user={escolhido} onTotal={handleTotal} />
        )}
      </div>
    </main>
  );
}
