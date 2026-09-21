import clientApi from "./_clientApi";

export async function taskDeleteApi(taskId: number): Promise<void> {
  const { data } = await clientApi.delete(`/me/tasks/${taskId}`);

  return data;
}
