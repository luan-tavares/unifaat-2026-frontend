import clientApi from "./_clientApi";
import type { Task } from "../types/api";

export async function taskUpdateApi(
  taskId: number,
  updates: Partial<Pick<Task, "name" | "is_done">>
): Promise<Task> {
  const { data } = await clientApi.put<Task>(`/me/tasks/${taskId}`, updates);

  return data;
}
