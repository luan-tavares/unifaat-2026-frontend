import tasksListRender from "../render/tasksListRender.js";
import { taskUpdateApi } from "../api/taskUpdateApi.js";

export default async function taskEditHandler(
    event: MouseEvent
): Promise<void> {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
        return;
    }

    const liElement = target.closest("li");

    if (!liElement) {
        return;
    }

    const nameElement = liElement.querySelector("span");

    if (!nameElement) {
        return;
    }

    const inputElement = document.createElement("input");
    inputElement.type = "text";
    inputElement.value = nameElement.innerText;
    inputElement.classList.add("form-control", "flex-grow-1", "ms-2");

    nameElement.replaceWith(inputElement);
    inputElement.focus();
    inputElement.select();

    const taskId = Number(liElement.dataset.taskId);
    const idUser = Number(liElement.dataset.userId);

    const saveTask = async (): Promise<void> => {
        const name = inputElement.value.trim();

        if (!name) {
            alert("O nome da tarefa não pode ficar vazio.");
            inputElement.focus();
            return;
        }

        try {
            await taskUpdateApi(taskId, { name });
            await tasksListRender(idUser);
        } catch (error) {
            alert("Erro ao editar tarefa");
            console.error(error);
        }
    };

    inputElement.addEventListener("keydown", async (keyboardEvent: KeyboardEvent) => {
        if (keyboardEvent.key === "Enter") {
            await saveTask();
        }
    });
}
