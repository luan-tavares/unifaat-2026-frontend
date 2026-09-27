import clientApi from './_clientApi';
import { PaginatedResponse, Task, PaginationParams } from '../types/api';

export async function tasksListApi(params: PaginationParams = {}): Promise<PaginatedResponse<Task>> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const { data } = await clientApi.get(`/me/tasks?page=${page}&limit=${limit}`);
  return data;
}