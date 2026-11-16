import userSearchApi from "../api/userSearchApi.js";
import { taskCreateApi } from "../api/taskCreateApi.js";
import userSearchResultsRender from "../render/userSearchResultsRender.js";
import tasksListRender from "../render/tasksListRender.js";
import type { User, UserSearchFilters } from "../types/api";

declare const bootstrap: {
    Modal: {
        getOrCreateInstance(element: HTMLElement): { hide: () => void };
    };
};

function getApiErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "response" in error) {
        const response = error.response;
        if (typeof response === "object" && response !== null && "data" in response) {
            const data = response.data;
            if (typeof data === "object" && data !== null && "error" in data && typeof data.error === "string") {
                return data.error;
            }
        }
    }
    return "Não foi possível concluir a operação. Tente novamente.";
}

export default function assignTaskModalListeners(idUser: number): void {
    const modalElement = document.querySelector("#assign-task-modal");
    const taskNameInput = document.querySelector("#assign-task-name");
    const searchField = document.querySelector("#assign-search-field");
    const searchValue = document.querySelector("#assign-search-value");
    const resultsElement = document.querySelector("#assign-search-results");
    const selectedUserElement = document.querySelector("#assign-selected-user");
    const submitButton = document.querySelector("#assign-task-submit");
    const searchButton = document.querySelector("#assign-user-search");
    const feedbackElement = document.querySelector("#assign-task-feedback");

    if (!(modalElement instanceof HTMLElement) || !(taskNameInput instanceof HTMLInputElement) ||
        !(searchField instanceof HTMLSelectElement) || !(searchValue instanceof HTMLInputElement) ||
        !(resultsElement instanceof HTMLElement) || !(selectedUserElement instanceof HTMLElement) ||
        !(submitButton instanceof HTMLButtonElement) || !(searchButton instanceof HTMLButtonElement) ||
        !(feedbackElement instanceof HTMLElement)) {
        return;
    }

    let selectedUser: User | null = null;

    const showFeedback = (message: string, isError: boolean = true): void => {
        feedbackElement.innerText = message;
        feedbackElement.className = isError ? "alert alert-danger mt-3" : "alert alert-success mt-3";
        feedbackElement.classList.remove("d-none");
    };

    const clearFeedback = (): void => {
        feedbackElement.innerText = "";
        feedbackElement.classList.add("d-none");
    };

    const clearModal = (): void => {
        taskNameInput.value = "";
        searchValue.value = "";
        resultsElement.innerHTML = "";
        selectedUser = null;
        selectedUserElement.innerText = "Nenhum usuário selecionado.";
        submitButton.disabled = false;
        clearFeedback();
    };

    searchButton.addEventListener("click", async () => {
        const value = searchValue.value.trim();
        if (!value) {
            showFeedback("Digite um valor para buscar.");
            return;
        }

        const field = searchField.value as keyof UserSearchFilters;
        const filters: UserSearchFilters = { [field]: value };
        selectedUser = null;
        selectedUserElement.innerText = "Nenhum usuário selecionado.";
        clearFeedback();
        resultsElement.innerHTML = "<li class=\"list-group-item text-muted\">Buscando...</li>";
        searchButton.disabled = true;

        try {
            const response = await userSearchApi(filters, 1, 10);
            userSearchResultsRender(response.data, (user) => {
                selectedUser = user;
                selectedUserElement.innerText = `Atribuir para: ${user.name} (${user.email})`;
                clearFeedback();
            });
                        if (response.data.length === 0) {
                resultsElement.innerHTML = "<li class=\"list-group-item text-muted\">Nenhum usuário encontrado.</li>";
                return;
            }

            const totalElement = document.createElement("li");
            totalElement.classList.add("list-group-item", "small", "text-muted");
                            totalElement.innerText = `${response.total} usuário(s) encontrado(s).`;
            resultsElement.prepend(totalElement);
        } catch (error) {
            resultsElement.innerHTML = "";
            showFeedback(getApiErrorMessage(error));
        } finally {
            searchButton.disabled = false;
        }
    });

    submitButton.addEventListener("click", async () => {
        const taskName = taskNameInput.value.trim();
        if (!taskName) {
            showFeedback("Digite o nome da tarefa.");
            taskNameInput.focus();
            return;
        }
        if (!selectedUser) {
            showFeedback("Busque e escolha um usuário antes de confirmar.");
            return;
        }

        submitButton.disabled = true;
        clearFeedback();
        try {
            await taskCreateApi(selectedUser.id, { name: taskName });
            const shouldRefresh = selectedUser.id === idUser;
            clearModal();
            bootstrap.Modal.getOrCreateInstance(modalElement).hide();
            const pageFeedback = document.querySelector("#assign-task-page-feedback");
            if (pageFeedback instanceof HTMLElement) {
                pageFeedback.innerText = "Tarefa atribuída com sucesso!";
                pageFeedback.className = "alert alert-success mt-3";
                pageFeedback.classList.remove("d-none");
            }
            if (shouldRefresh) {
                await tasksListRender(idUser);
            }
        } catch (error) {
            showFeedback(getApiErrorMessage(error));
        } finally {
            submitButton.disabled = false;
        }
    });

    modalElement.addEventListener("hidden.bs.modal", clearModal);
}
