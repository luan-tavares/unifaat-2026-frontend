import { useEffect, useState } from "react";
import axios from "axios";
import clientApi from "../api/clientApi";

interface UseAxiosResult<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

function useAxios<T>(url: string | null): UseAxiosResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [attempt, setAttempt] = useState<number>(0);

  const refetch = () => setAttempt((prev) => prev + 1);

  useEffect(() => {
    if (url === null) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await clientApi.get<T>(url, {
          signal: controller.signal,
        });
        setData(response.data);
      } catch (err) {
        if (axios.isCancel(err)) {
          return;
        }

        if (axios.isAxiosError(err)) {
          setError(err.message);
          return;
        }

        setError("Unexpected error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => controller.abort();
  }, [url, attempt]);

  return { data, error, isLoading, refetch };
}

export default useAxios;
