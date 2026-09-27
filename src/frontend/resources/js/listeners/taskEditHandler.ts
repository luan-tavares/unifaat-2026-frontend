import tasksListRender from "../render/tasksListRender";
import { taskUpdateApi } from "../api/taskUpdateApi";

export async function taskEditHandler(taskId: number, newName: string, idUser: number): Promise<void> {
  try {
    if (!newName || newName.trim() === '') {
      alert('O nome da tarefa não pode ser vazio.');
      return;
    }
    
    // API Contextual: Mandamos só o que mudou, e a API não pede o idUser mais.
    await taskUpdateApi(taskId, { name: newName.trim() });
    
    // Recarrega a lista para mostrar a alteração
    await tasksListRender(idUser);
  } catch (error) {
    console.error(error);
    alert('Erro ao atualizar a tarefa.');
  }
}