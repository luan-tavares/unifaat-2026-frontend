import { AxiosError } from "axios";

/** Mensagem de erro da API (campo "error") ou o texto padrão informado. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof AxiosError)) return fallback;

  const data: { error?: string } | undefined = error.response?.data;

  return data?.error ?? fallback;
}
