/** Uma tarefa da lista. */
export type Task = {
  id: string;
  name: string;
  isDone: boolean;
};

/**
 * Filtro ativo.
 *
 * União de literais, e não `string`: assim o compilador recusa
 * `"pendentes"` ou qualquer outro valor que não exista, e o `Record`
 * de filtros em `App.tsx` é obrigado a cobrir os três casos.
 */
export type Filter = "all" | "pending" | "done";
