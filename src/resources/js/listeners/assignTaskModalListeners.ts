import { Modal } from "bootstrap";
import { userSearchApi } from "../api/userSearchApi";
import { taskCreateApi } from "../api/taskCreateApi";
import userSearchResultsRender from "../render/userSearchResultsRender";
import tasksListRender from "../render/tasksListRender";

import type { User, UserSearchFilters } from "../types/api";

type SearchField =
  | "name"
  | "email"
  | "job_title"
  | "city"
  | "state"
  | "bio";

export default function assignTaskModalListeners(
  idUser: number
): void {
  const modalElement = document.querySelector<HTMLDivElement>(
    "#assign-task-modal"
  );

  const taskNameInput = document.querySelector<HTMLInputElement>(
    "#assign-task-name"
  );

  const searchField = document.querySelector<HTMLSelectElement>(
    "#assign-search-field"
  );

  const searchValue = document.querySelector<HTMLInputElement>(
    "#assign-search-value"
  );

  const searchButton = document.querySelector<HTMLButtonElement>(
    "#assign-search-btn"
  );

  const results = document.querySelector<HTMLDivElement>(
    "#assign-search-results"
  );

  const selectedUserElement = document.querySelector<HTMLDivElement>(
    "#assign-selected-user"
  );

  const messageElement = document.querySelector<HTMLDivElement>(
    "#assign-task-message"
  );

  const submitButton = document.querySelector<HTMLButtonElement>(
    "#assign-task-submit"
  );

  if (
    !modalElement ||
    !taskNameInput ||
    !searchField ||
    !searchValue ||
    !searchButton ||
    !results ||
    !selectedUserElement ||
    !messageElement ||
    !submitButton
  ) {
    console.error("Elementos do modal não encontrados.");
    return;
  }

  const modal = Modal.getOrCreateInstance(modalElement);

  let selectedUser: User | null = null;
  let searching = false;
  let creating = false;
  let searchVersion = 0;

  function showMessage(
    text: string,
    type: "success" | "danger" | "warning" = "warning"
  ): void {
    messageElement!.className = `alert alert-${type}`;
    messageElement!.textContent = text;
  }

  function clearMessage(): void {
    messageElement!.textContent = "";
    messageElement!.className = "d-none";
  }

  function updateSubmitButton(): void {
    submitButton!.disabled =
      creating ||
      !taskNameInput!.value.trim() ||
      selectedUser === null;
  }

  function clearSelection(): void {
    selectedUser = null;
    selectedUserElement!.textContent = "";
    selectedUserElement!.classList.add("d-none");
    updateSubmitButton();
  }

  function resetModal(): void {
    searchVersion++;
    taskNameInput!.value = "";
    searchValue!.value = "";
    searchField!.value = "name";
    results!.replaceChildren();
    clearSelection();
    clearMessage();
    updateSubmitButton();
  }

  taskNameInput.addEventListener("input", updateSubmitButton);

  searchField.addEventListener("change", () => {
    searchVersion++;
    results.replaceChildren();
    clearSelection();
  });

  searchValue.addEventListener("input", () => {
    searchVersion++;
    results.replaceChildren();
    clearSelection();
  });

  searchButton.addEventListener("click", async () => {
    const value = searchValue.value.trim();

    clearMessage();
    clearSelection();
    results.replaceChildren();

    if (!value) {
      showMessage("Digite um texto para pesquisar.");
      return;
    }

    if (searching) {
      showMessage("Aguarde a pesquisa atual terminar.");
      return;
    }

    const field = searchField.value as SearchField;

    const filters: UserSearchFilters = {
      [field]: value
    };

    const currentSearch = ++searchVersion;

    searching = true;
    searchButton.disabled = true;

    try {
      const response = await userSearchApi(filters, 1, 10);

      if (currentSearch !== searchVersion) {
        return;
      }

      userSearchResultsRender(response, (user: User) => {
        selectedUser = user;

        selectedUserElement!.textContent =
          `Atribuir para: ${user.name} (${user.email})`;

        selectedUserElement!.classList.remove("d-none");

        clearMessage();
        updateSubmitButton();
      });
    } catch (error: unknown) {
      console.error("Erro ao buscar usuários:", error);

      if (currentSearch !== searchVersion) {
        return;
      }

      showMessage(
        "Não foi possível buscar usuários. Tente novamente.",
        "danger"
      );
    } finally {
      searching = false;
      searchButton.disabled = false;
    }
  });

  submitButton.addEventListener("click", async () => {
    const name = taskNameInput.value.trim();

    if (!name) {
      showMessage("Digite o nome da tarefa.");
      return;
    }

    if (!selectedUser) {
      showMessage("Escolha um usuário para receber a tarefa.");
      return;
    }

    if (creating) {
      return;
    }

    creating = true;
    updateSubmitButton();
    clearMessage();

    const destinationUser = selectedUser;

    try {
      await taskCreateApi(destinationUser.id, { name });

      if (destinationUser.id === idUser) {
        await tasksListRender(idUser);
      }

      
      modal.hide();

      const notification = document.createElement("div");
      notification.className =
        "alert alert-success container mt-3";
      notification.setAttribute("role", "status");
      notification.textContent =
        "Tarefa criada e atribuída com sucesso!";

      const main = document.querySelector("main");
      main?.before(notification);

      window.setTimeout(() => {
        notification.remove();
      }, 5000);
    } catch (error: unknown) {
      console.error("Erro ao criar tarefa:", error);

      showMessage(
        "Erro ao criar tarefa. Tente novamente.",
        "danger"
      );
    } finally {
      creating = false;
      updateSubmitButton();
    }
  });

  modalElement.addEventListener("hidden.bs.modal", () => {
    resetModal();
  });
}
