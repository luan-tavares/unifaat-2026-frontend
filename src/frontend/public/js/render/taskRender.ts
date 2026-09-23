import taskToggleHandler from "../listeners/taskToggleHandler.js";
import taskDeleteHandler from "../listeners/taskDeleteHandler.js";
import taskEditHandler from "../listeners/taskEditHandler.js";
import type { Task } from "../types/api";

export default function taskRender(
    task: Task,
    idUser: number
): HTMLLIElement {
    const liElement = document.createElement("li");

    liElement.classList.add(
        "list-group-item",
        "d-flex",
        "justify-content-between",
        "align-items-center"
    );

    liElement.dataset.taskId = String(task.id);
    liElement.dataset.userId = String(idUser);

    const checkboxElement = document.createElement("input");
    checkboxElement.type = "checkbox";
    checkboxElement.classList.add("form-check-input");
    checkboxElement.checked = task.is_done;
    checkboxElement.addEventListener("change", taskToggleHandler);

    const nameElement = document.createElement("span");
    nameElement.innerText = task.name;
    nameElement.classList.add("flex-grow-1", "ms-2");

    if (task.is_done) {
        nameElement.classList.add(
            "text-decoration-line-through",
            "text-muted"
        );
    }

    const buttonEditElement = document.createElement("button");
    buttonEditElement.classList.add("btn", "btn-warning", "btn-sm", "me-2");
    buttonEditElement.innerText = "Editar";
    buttonEditElement.addEventListener("click", taskEditHandler);

    const buttonDeleteElement = document.createElement("button");
    buttonDeleteElement.classList.add("btn", "btn-danger", "btn-sm");
    buttonDeleteElement.innerText = "Excluir";
    buttonDeleteElement.addEventListener("click", taskDeleteHandler);

    liElement.append(checkboxElement);
    liElement.append(nameElement);
    liElement.append(buttonEditElement);
    liElement.append(buttonDeleteElement);

    return liElement;
}
