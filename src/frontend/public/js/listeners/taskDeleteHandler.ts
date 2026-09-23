import tasksListRender from "../render/tasksListRender.js";
import { taskDeleteApi } from "../api/taskDeleteApi.js";

export default async function taskDeleteHandler(
    event: MouseEvent
): Promise<void> {
    const confirmed = confirm("Tem certeza que deseja excluir esta tarefa?");

    if (!confirmed) {
        return;
    }

    const target = event.target;

    if (!(target instanceof HTMLElement)) {
        return;
    }

    const liElement = target.closest("li");

    if (!liElement) {
        return;
    }

    const taskId = Number(liElement.dataset.taskId);
    const idUser = Number(liElement.dataset.userId);

    try {
        await taskDeleteApi(taskId);
        await tasksListRender(idUser);
    } catch (error) {
        alert("Erro ao excluir tarefa");
        console.error(error);
    }
}
