import clientApi from "./_clientApi.js";

export interface TaskUpdate {
    name?: string;
    is_done?: boolean;
}

export async function taskUpdateApi(
    taskId: number,
    updates: TaskUpdate
): Promise<unknown> {
    const { data } = await clientApi.put(
        `/me/tasks/${taskId}`,
        updates
    );

    return data;
}
