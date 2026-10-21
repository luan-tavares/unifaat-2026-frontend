import { userSearchApi } from "../api/userSearchApi";
import { taskCreateApi } from "../api/taskCreateApi";
import userSearchResultsRender from "../render/userSearchResultsRender";
import tasksListRender from "../render/tasksListRender";
import type { User, UserSearchFilters } from "../types/api";

type SearchField = Exclude<keyof UserSearchFilters, "is_active">;

const SEARCH_FIELDS: SearchField[] = ["name", "email", "job_title", "city", "state", "bio"];

function isSearchField(value: string): value is SearchField {
  return (SEARCH_FIELDS as string[]).includes(value);
}

function showMessage(text: string, type: "danger" | "warning"): void {
  const messageElement = document.querySelector<HTMLDivElement>("#assign-task-message");

  if (!messageElement) return;

  messageElement.className = `alert alert-${type} py-2 mb-0`;
  messageElement.innerText = text;
}

function hideMessage(): void {
  const messageElement = document.querySelector<HTMLDivElement>("#assign-task-message");

  messageElement?.classList.add("d-none");
}

export default async function assignTaskModalListeners(idUser: number): Promise<void> {
  const modalElement = document.querySelector<HTMLDivElement>("#assign-task-modal");
  const taskNameInput = document.querySelector<HTMLInputElement>("#assign-task-name");
  const searchFieldSelect = document.querySelector<HTMLSelectElement>("#assign-search-field");
  const searchValueInput = document.querySelector<HTMLInputElement>("#assign-search-value");
  const searchButton = document.querySelector<HTMLButtonElement>("#assign-search-btn");
  const resultsContainer = document.querySelector<HTMLDivElement>("#assign-search-results");
  const selectedUserElement = document.querySelector<HTMLDivElement>("#assign-selected-user");
  const submitButton = document.querySelector<HTMLButtonElement>("#assign-task-submit");
  const cancelButton = document.querySelector<HTMLButtonElement>("#assign-task-cancel");

  if (!modalElement || !taskNameInput || !searchFieldSelect || !searchValueInput || !searchButton) return;
  if (!resultsContainer || !selectedUserElement || !submitButton || !cancelButton) return;

  let selectedUser: User | null = null;

  const updateSubmitState = (): void => {
    submitButton.disabled = !taskNameInput.value.trim() || selectedUser === null;
  };

  const chooseUser = (user: User): void => {
    selectedUser = user;
    selectedUserElement.className = "alert alert-primary py-2 mb-0";
    selectedUserElement.innerText = `Atribuir para: ${user.name} (${user.email})`;
    updateSubmitState();
  };

  const resetModal = (): void => {
    selectedUser = null;
    taskNameInput.value = "";
    searchValueInput.value = "";
    searchFieldSelect.selectedIndex = 0;
    resultsContainer.innerHTML = "";
    selectedUserElement.className = "d-none";
    selectedUserElement.innerText = "";
    hideMessage();
    updateSubmitState();
  };

  const search = async (): Promise<void> => {
    hideMessage();

    const value = searchValueInput.value.trim();

    if (!value) {
      resultsContainer.innerHTML = "";
      showMessage("Digite algo para buscar.", "warning");
      return;
    }

    const field = searchFieldSelect.value;

    if (!isSearchField(field)) {
      showMessage("Campo de busca inválido.", "danger");
      return;
    }

    const filters: UserSearchFilters = { [field]: value };

    searchButton.disabled = true;

    try {
      const result = await userSearchApi(filters, 1, 10);
      userSearchResultsRender(result, chooseUser);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      resultsContainer.innerHTML = "";
      showMessage("Não foi possível buscar usuários. Tente novamente.", "danger");
    } finally {
      searchButton.disabled = false;
    }
  };

  searchButton.addEventListener("click", search);

  searchValueInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    search();
  });

  taskNameInput.addEventListener("input", updateSubmitState);

  submitButton.addEventListener("click", async () => {
    hideMessage();

    const taskName = taskNameInput.value.trim();

    if (!taskName) {
      showMessage("Digite o nome da tarefa.", "warning");
      return;
    }

    if (selectedUser === null) {
      showMessage("Escolha um usuário.", "warning");
      return;
    }

    const targetUser = selectedUser;
    submitButton.disabled = true;

    try {
      await taskCreateApi(targetUser.id, { name: taskName });
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      showMessage("Não foi possível criar a tarefa. Tente novamente.", "danger");
      updateSubmitState();
      return;
    }

    // Fecha o modal pelo próprio botão de data-bs-dismiss (o reset roda no hidden.bs.modal)
    cancelButton.click();

    if (targetUser.id === idUser) {
      await tasksListRender(idUser);
    }

    alert(`Tarefa criada para ${targetUser.name}`);
  });

  // Fechar pelo X, Cancelar, ESC ou após criar sempre limpa o modal
  modalElement.addEventListener("hidden.bs.modal", resetModal);

  updateSubmitState();
}
