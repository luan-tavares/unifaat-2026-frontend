import tasksListRender from "../render/tasksListRender";
import { taskUpdateApi } from "../api/taskUpdateApi";
import type { TaskListItemElement } from "../types/dom";

export default async function taskEditHandler(event: Event): Promise<void> {
  const liElement = (event.target as HTMLElement).closest("li") as TaskListItemElement | null;
  if (!liElement) return;

  const { taskId } = liElement;

  // Pega o nome atual do span de nome
  const nameSpan = liElement.querySelector<HTMLSpanElement>("span.flex-grow-1");
  const currentName = nameSpan?.innerText ?? "";

  const newName = prompt("Editar nome da tarefa:", currentName);

  // Cancela se o usuário clicou em "Cancelar" ou não alterou o nome
  if (newName === null || newName.trim() === "" || newName.trim() === currentName) return;

  try {
    await taskUpdateApi(taskId, { name: newName.trim() });
    await tasksListRender();
  } catch (error) {
    alert("Erro ao editar tarefa");
    console.error(error);
  }
}
