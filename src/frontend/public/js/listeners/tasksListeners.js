import tasksListRender from "../render/tasksListRender.js";
import { clearUserId } from "../utils/getUserIdFromAuth.js";
import { taskCreateApi } from "../api/taskCreateApi.js";

export default async function tasksListeners(idUser) {
    const addTaskBtn = document.querySelector("#add-task-btn");
    const logoutBtn = document.querySelector("#logout-btn");

    if (!(addTaskBtn instanceof HTMLElement)) {
        return;
    }

    if (!(logoutBtn instanceof HTMLElement)) {
        return;
    }

    addTaskBtn.addEventListener("click", async () => {
        const taskInput = document.querySelector("#task-input");

        if (!(taskInput instanceof HTMLInputElement)) {
            return;
        }

        const taskName = taskInput.value.trim();

        if (!taskName) {
            alert("Digite uma tarefa!");
            return;
        }

        try {
            await taskCreateApi({ name: taskName });

            taskInput.value = "";

            await tasksListRender(idUser);
        } catch (error) {
            alert("Erro ao criar tarefa");
            console.error(error);
        }
    });

    logoutBtn.addEventListener("click", () => {
        clearUserId();
        window.location.href = "/login.html";
    });
}