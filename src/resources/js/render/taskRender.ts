import taskDeleteHandler from "../listeners/taskDeleteHandler";
import taskToggleHandler from "../listeners/taskToggleHandler";
import type { Task } from "../types/api";
import type { TaskListItemElement } from "../types/dom";

export default function taskRender(task: Task, idUser: number): TaskListItemElement {
  const liElement = document.createElement("li") as TaskListItemElement;
  liElement.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center");
  liElement.taskId = task.id;
  liElement.userId = idUser;

  const nameElement = document.createElement("span");
  nameElement.innerText = task.name;
  nameElement.classList.add("flex-grow-1");

  const checkboxElement = document.createElement("input");
  checkboxElement.type = "checkbox";
  checkboxElement.classList.add("form-check-input");
  checkboxElement.checked = task.is_done;
  checkboxElement.addEventListener("change", taskToggleHandler);
  liElement.prepend(checkboxElement);

  if (task.is_done) {
    nameElement.classList.add("text-decoration-line-through", "text-muted");
  }

  liElement.append(nameElement);

  const buttonDeleteElement = document.createElement("button");
  buttonDeleteElement.classList.add("btn", "btn-danger", "btn-sm");
  buttonDeleteElement.innerText = "Excluir";
  buttonDeleteElement.addEventListener("click", taskDeleteHandler);
  liElement.append(buttonDeleteElement);

  return liElement;
}
