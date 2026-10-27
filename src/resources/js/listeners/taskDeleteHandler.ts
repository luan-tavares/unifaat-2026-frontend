import tasksListRender from "../render/tasksListRender";
import { taskDeleteApi } from "../api/taskDeleteApi";
import type { TaskListItemElement } from "../types/dom";

export default async function taskDeleteHandler(event: Event): Promise<void> {
  const liElement = (event.target as HTMLElement).closest("li") as TaskListItemElement | null;
  if (!liElement) return;

  const { userId: idUser, taskId } = liElement;

  if (!confirm("Deseja excluir esta tarefa?")) return;

  try {
    await taskDeleteApi(idUser, taskId);
    await tasksListRender(idUser);
  } catch (error) {
    alert("Erro ao excluir tarefa");
    console.error(error);
  }
}
