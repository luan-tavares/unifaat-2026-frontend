import { useEffect, useState } from "react";
import { isCancel } from "axios";

import { clientApi } from "../api/clientApi";

type Retorno<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
};

/**
 * GET pelo `clientApi`, com os estados da requisição.
 *
 * `url === null` deixa o hook parado: é como o componente diz "ainda não
 * há nada para buscar" sem precisar de um segundo hook nem de um `if`
 * antes da chamada — hook chamado dentro de condicional quebra a ordem
 * dos hooks.
 */
export function useAxios<T>(url: string | null): Retorno<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Contador de tentativas. É o que faz o `refetch` funcionar: ele muda
  // um primitivo que está nas dependências, e o efeito refaz o trabalho.
  // Guardar a função de busca em estado, ou pôr um objeto nas
  // dependências, faria o efeito rodar a cada render.
  const [attempt, setAttempt] = useState<number>(0);

  useEffect(() => {
    // Parado: limpa o que havia e não chama nada.
    if (url === null) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    // `async` declarada DENTRO do efeito e chamada em seguida. Passar uma
    // função `async` direto ao `useEffect` devolveria uma Promise onde o
    // React espera a função de limpeza.
    const buscar = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const resposta = await clientApi.get<T>(url, {
          signal: controller.signal,
        });
        setData(resposta.data);
      } catch (err) {
        // Cancelamento não é erro: foi o próprio app que abortou, ao
        // trocar de usuário ou de página. Mostrar isso na tela faria a
        // navegação rápida parecer falha.
        if (isCancel(err)) {
          return;
        }

        setData(null);
        setError(mensagemDoErro(err));
      } finally {
        // Roda também quando cancelado, e isso é correto: o efeito que
        // cancelou já montou o seu próprio `isLoading`.
        setIsLoading(false);
      }
    };

    buscar();

    // Limpeza: aborta a requisição anterior. É o que garante que a
    // resposta velha nunca sobrescreva a nova — sem isso, trocar de
    // usuário rápido mostra as tasks do usuário anterior, porque a
    // ordem de chegada não segue a ordem dos pedidos.
    return () => controller.abort();
  }, [url, attempt]);

  // `attempt + 1` pela forma de função: o valor novo depende do anterior.
  const refetch = () => setAttempt((atual) => atual + 1);

  return { data, error, isLoading, refetch };
}

/** Mensagem legível, sem vazar objeto de erro para a tela. */
function mensagemDoErro(err: unknown): string {
  if (err instanceof Error) {
    return err.message;
  }

  return "Falha na requisição";
}
