import tasksListRender from "../render/tasksListRender";
import { taskUpdateApi } from "../api/taskUpdateApi";
import type { TaskListItemElement } from "../types/dom";

export default function taskEditHandler(event: Event): void {
  const liElement = (event.target as HTMLElement).closest("li") as TaskListItemElement | null;
  if (!liElement) return;

  const nameElement = liElement.querySelector<HTMLSpanElement>(".task-name");
  if (!nameElement) return;

  const { userId: idUser, taskId } = liElement;
  const currentName = nameElement.innerText;

  const inputElement = document.createElement("input");
  inputElement.type = "text";
  inputElement.classList.add("form-control", "form-control-sm", "flex-grow-1");
  inputElement.value = currentName;

  nameElement.replaceWith(inputElement);
  inputElement.focus();
  inputElement.select();

  let settled = false;

  const cancel = (): void => {
    if (settled) return;
    settled = true;
    void tasksListRender(idUser);
  };

  const confirmEdit = async (): Promise<void> => {
    if (settled) return;
    settled = true;

    const newName = inputElement.value.trim();

    if (!newName || newName === currentName) {
      await tasksListRender(idUser);
      return;
    }

    try {
      await taskUpdateApi(taskId, { name: newName });
    } catch (error) {
      alert("Erro ao editar tarefa");
      console.error(error);
    }

    await tasksListRender(idUser);
  };

  inputElement.addEventListener("keydown", (keyEvent) => {
    if (keyEvent.key === "Enter") void confirmEdit();
    if (keyEvent.key === "Escape") cancel();
  });

  inputElement.addEventListener("blur", () => void confirmEdit());
}
