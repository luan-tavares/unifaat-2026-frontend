import clientApi from "./_clientApi.js";

// Com um objeto, mantém a criação de tarefas do próprio usuário.
// Com idUser + tarefa, cria uma tarefa para o usuário selecionado.
export async function taskCreateApi(idUserOrTask, task) {
    if (typeof idUserOrTask === "number") {
        const { data } = await clientApi.post(`/users/${idUserOrTask}/tasks`, task);
        return data;
    }

    const { data } = await clientApi.post("/me/tasks", idUserOrTask);
    return data;
}
