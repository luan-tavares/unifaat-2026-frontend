import tasksListRender from "../render/tasksListRender.js";
import { taskDeleteApi } from "../api/taskDeleteApi.js";

export default async function taskDeleteHandler(event) {
    const liElement = event.target.closest("li");
    const idUser = liElement.userId;
    const taskId = liElement.taskId;

    if (!confirm("Tem certeza que deseja excluir esta tarefa?")) {
        return;
    }

    try {
        await taskDeleteApi(idUser, taskId);
        await tasksListRender(idUser);
    } catch (error) {
        alert("Erro ao excluir tarefa");
        console.error(error);
    }
}
