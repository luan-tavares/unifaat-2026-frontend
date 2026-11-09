
import { useEffect, useState } from "react";
import axios, { isCancel } from "axios";
import clientApi from "../api/clientApi";

interface UseAxiosResponse<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

function useAxios<T>(url: string | null): UseAxiosResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (url === null) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setData(null);

      try {
        const response = await clientApi.get<T>(url, {
          signal: controller.signal,
        });

        setData(response.data);
      } catch (err: unknown) {
        if (isCancel(err)) {
          return;
        }

        if (axios.isAxiosError(err)) {
          setError(err.message);
        } else {
          setError("Ocorreu um erro inesperado.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [url, attempt]);

  const refetch = () => {
    setAttempt((previousAttempt) => previousAttempt + 1);
  };

  return {
    data,
    error,
    isLoading,
    refetch,
  };
}

export default useAxios;
