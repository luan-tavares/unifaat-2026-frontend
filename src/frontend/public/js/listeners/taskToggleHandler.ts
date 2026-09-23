import tasksListRender from "../render/tasksListRender.js";
import { taskUpdateApi } from "../api/taskUpdateApi.js";

export default async function taskToggleHandler(
    event: Event
): Promise<void> {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
        return;
    }

    const liElement = target.closest("li");

    if (!liElement) {
        return;
    }

    const taskId = Number(liElement.dataset.taskId);
    const idUser = Number(liElement.dataset.userId);
    const isDone = target.checked;

    try {
        await taskUpdateApi(taskId, { is_done: isDone });
        await tasksListRender(idUser);
    } catch (error) {
        alert("Erro ao atualizar tarefa");
        console.error(error);
    }
}
