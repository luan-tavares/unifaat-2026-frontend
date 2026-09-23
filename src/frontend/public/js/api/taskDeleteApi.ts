import clientApi from "./_clientApi.js";

export async function taskDeleteApi(taskId: number): Promise<unknown> {
    const { data } = await clientApi.delete(`/me/tasks/${taskId}`);

    return data;
}
