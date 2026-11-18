import tasksListRender from "../render/tasksListRender";
import { taskUpdateApi } from "../api/taskUpdateApi";
import type { TaskListItemElement } from "../types/dom";

export default async function taskEditHandler(event: Event): Promise<void> {
  const liElement = (event.target as HTMLElement).closest("li") as TaskListItemElement | null;
  if (!liElement) return;

  const { userId: idUser, taskId } = liElement;

  // Pega o span do nome (primeiro span dentro do li)
  const nameSpan = liElement.querySelector<HTMLSpanElement>("span.flex-grow-1");
  if (!nameSpan) return;

  const currentName = nameSpan.innerText;

  // Troca o span por um input editável
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentName;
  input.classList.add("form-control", "form-control-sm", "flex-grow-1", "me-2");
  nameSpan.replaceWith(input);
  input.focus();
  input.select();

  // Botão salvar
  const saveButton = liElement.querySelector<HTMLButtonElement>("button.btn-edit");
  if (saveButton) {
    saveButton.innerText = "Salvar";
    saveButton.classList.replace("btn-secondary", "btn-success");
  }

  const save = async () => {
    const newName = input.value.trim();

    if (!newName) {
      alert("O nome da tarefa não pode ser vazio.");
      return;
    }

    if (newName === currentName) {
      await tasksListRender(idUser);
      return;
    }

    try {
      await taskUpdateApi(taskId, { name: newName });
      await tasksListRender(idUser);
    } catch (error) {
      alert("Erro ao editar tarefa");
      console.error(error);
    }
  };

  // Confirma com Enter, cancela com Escape
  input.addEventListener("keydown", async (e: KeyboardEvent) => {
    if (e.key === "Enter") await save();
    if (e.key === "Escape") await tasksListRender(idUser);
  });

  // Confirma ao perder o foco
  input.addEventListener("blur", save, { once: true });
}
