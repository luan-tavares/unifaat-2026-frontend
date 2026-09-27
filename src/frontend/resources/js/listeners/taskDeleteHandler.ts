import tasksListRender from "../render/tasksListRender";
import { taskDeleteApi } from "../api/taskDeleteApi";
import type { TaskListItemElement } from "../types/dom";

export default async function taskDeleteHandler(event: Event): Promise<void> {
  const liElement = (event.target as HTMLElement).closest("li") as TaskListItemElement | null;
  if (!liElement) return;

  const { userId: idUser, taskId } = liElement;

  try {
    // API Contextual: deleta passando só a task. (Requer que taskDeleteApi já esteja atualizada)
    await taskDeleteApi(taskId); 
    await tasksListRender(idUser);
  } catch (error) {
    console.error(error);
    alert("Erro ao excluir tarefa");
  }
}