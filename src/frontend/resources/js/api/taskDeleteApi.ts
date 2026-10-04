import clientApi from "./_clientApi";

export async function taskDeleteApi(taskId: number): Promise<void> {
  await clientApi.delete(`/me/tasks/${taskId}`);
}
