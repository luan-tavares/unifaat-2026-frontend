import { useEffect, useState } from "react";
import { isCancel } from "axios";
import clientApi from "../api/clientApi.ts";
import { getErrorMessage } from "../utils/getErrorMessage.ts";

type UseAxiosResult<T> = {
  data: T | null;
  error: string;
  isLoading: boolean;
  refetch: () => void;
};

/**
 * GET com Axios + os três estados da requisição.
 *
 * - url === null: o hook fica parado (nada para buscar).
 * - dependências só primitivas: [url, attempt].
 * - a limpeza cancela a requisição anterior com AbortController,
 *   então uma resposta velha nunca sobrescreve a nova.
 */
export function useAxios<T>(url: string | null): UseAxiosResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(url !== null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Sem url o hook fica parado: nenhuma requisição
    if (url === null) return;

    const target = url;
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError("");

      try {
        const response = await clientApi.get<T>(target, { signal: controller.signal });
        setData(response.data);
      } catch (err) {
        // Cancelamento não é erro: foi a limpeza do efeito que pediu
        if (isCancel(err)) return;
        setError(getErrorMessage(err, "Erro ao carregar os dados"));
      }

      setIsLoading(false);
    }

    load();

    return () => {
      controller.abort();
    };
  }, [url, attempt]);

  // Só muda um estado: quem refaz a chamada é o efeito
  function refetch() {
    setAttempt((current) => current + 1);
  }

  // Parado (url null): devolve tudo vazio, calculado aqui em vez de setState no efeito
  if (url === null) {
    return { data: null, error: "", isLoading: false, refetch };
  }

  return { data, error, isLoading, refetch };
}
