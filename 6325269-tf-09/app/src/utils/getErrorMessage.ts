import { isAxiosError } from "axios";

// Transforma o erro do Axios numa mensagem para a tela
export function getErrorMessage(err: unknown, fallback: string): string {
  if (!isAxiosError(err)) {
    return fallback;
  }

  if (!err.response) {
    return `${fallback}: não foi possível falar com o servidor.`;
  }

  return `${fallback} (HTTP ${err.response.status}).`;
}
