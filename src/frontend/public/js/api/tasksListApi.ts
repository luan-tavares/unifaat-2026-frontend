import clientApi from "./_clientApi.js";
import type { PaginatedResponse, Task } from "../types/api";

export async function tasksListApi(
    { page = 1, limit = 10 }: { page?: number; limit?: number } = {}
): Promise<PaginatedResponse<Task>> {
    const { data } = await clientApi.get<PaginatedResponse<Task>>("/me/tasks", {
        params: { page, limit }
    });

    return data;
}
