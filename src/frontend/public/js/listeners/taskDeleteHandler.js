import tasksListRender from "../render/tasksListRender.js";
import { taskDeleteApi } from "../api/taskDeleteApi.js";

export default async function taskDeleteHandler(event) {
    const liElement = event.target.closest("li");
    const idUser = liElement.userId;
    const taskId = liElement.taskId;


    // Trecho adicionado para o TF - confirmação antes de deletar.
    const confirmado = confirm("Tem certeza que deseja excluir essa tarefa?");

    if (!confirmado){
        return; //se o usuário clicar em cancelar, não faz nada - sai da função.
    }
        
    try {
        await taskDeleteApi(idUser, taskId);
        await tasksListRender(idUser);
    } catch (error) {
        alert("Erro ao excluir tarefa!") // adicionei como um extra para avisar quando der erro na exclusão de tarefas.
        console.error(error);
    }
}
