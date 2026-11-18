import { useEffect, useState } from "react";
import { isCancel } from "axios";
import { clientApi } from "../api/clientApi";

type UseAxiosResult<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
};

export function useAxios<T>(url: string | null): UseAxiosResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [attempt, setAttempt] = useState<number>(0);

  useEffect(() => {
    if (url === null) {
      setData(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await clientApi.get<T>(url, {
          signal: controller.signal,
        });
        setData(response.data);
        setIsLoading(false);
      } catch (err) {
        if (isCancel(err)) {
          return;
        }
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        setIsLoading(false);
      }
    };

    load();

    return () => {
      controller.abort();
    };
  }, [url, attempt]);

  const refetch = () => {
    setAttempt((previousAttempt) => previousAttempt + 1);
  };

  return { data, error, isLoading, refetch };
}
