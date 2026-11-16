import tasksListRender from "../render/tasksListRender.js";
import tasksListeners from "../listeners/tasksListeners.js";
import {
    checkAuthentication,
    redirectToLogin
} from "../utils/checkAuthentication.js";
import {
    setUserId,
    clearUserId
} from "../utils/getUserIdFromAuth.js";

window.addEventListener("DOMContentLoaded", async (): Promise<void> => {
    const auth = await checkAuthentication();

    if (!auth.authenticated) {
        clearUserId();
        redirectToLogin();
        return;
    }

    const { idUser } = auth;
    setUserId(idUser);

    try {
        await tasksListRender(idUser);
        await tasksListeners(idUser);
    } catch (error) {
        console.error("Falha ao carregar tarefas:", error);

        const container = document.querySelector("#tasks-container");

        if (container instanceof HTMLElement) {
            container.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    Não foi possível carregar suas tarefas. Verifique a conexão e atualize a página.
                </div>
            `;
        }
    }
});
