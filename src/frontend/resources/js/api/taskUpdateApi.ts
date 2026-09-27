import clientApi from './_clientApi';
import { Task } from '../types/api';

export async function taskUpdateApi(taskId: number, payload: { name?: string; is_done?: boolean }): Promise<Task> {
  const { data } = await clientApi.put(`/me/tasks/${taskId}`, payload);
  return data;
}