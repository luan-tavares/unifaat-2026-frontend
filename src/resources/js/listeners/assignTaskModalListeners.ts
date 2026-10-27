import { taskCreateApi } from "../api/taskCreateApi";
import { userSearchApi } from "../api/userSearchApi";
import { getErrorMessage } from "../utils/getErrorMessage";
import tasksListRender from "../render/tasksListRender";
import userSearchResultsRender from "../render/userSearchResultsRender";
import type { User, UserSearchFilters } from "../types/api";

export default async function assignTaskModalListeners(currentUserId: number): Promise<void> {
  const modal = document.querySelector<HTMLElement>("#assign-task-modal");
  const taskNameInput = document.querySelector<HTMLInputElement>("#assign-task-name");
  const searchField = document.querySelector<HTMLSelectElement>("#assign-search-field");
  const searchValue = document.querySelector<HTMLInputElement>("#assign-search-value");
  const searchButton = document.querySelector<HTMLButtonElement>("#assign-search-submit");
  const results = document.querySelector<HTMLElement>("#assign-search-results");
  const selectedUserDisplay = document.querySelector<HTMLElement>("#assign-selected-user");
  const feedback = document.querySelector<HTMLElement>("#assign-task-feedback");
  const submitButton = document.querySelector<HTMLButtonElement>("#assign-task-submit");
  const cancelButton = document.querySelector<HTMLButtonElement>("#assign-task-cancel");
  const successMessage = document.querySelector<HTMLElement>("#assign-task-success");

  if (
    !modal ||
    !taskNameInput ||
    !searchField ||
    !searchValue ||
    !searchButton ||
    !results ||
    !selectedUserDisplay ||
    !feedback ||
    !submitButton ||
    !cancelButton ||
    !successMessage
  ) return;

  let selectedUser: User | null = null;
  let isSubmitting = false;

  const showFeedback = (message: string): void => {
    feedback.textContent = message;
    feedback.className = "alert alert-danger";
    feedback.hidden = message.length === 0;
  };

  const updateSubmitButton = (): void => {
    submitButton.disabled =
      isSubmitting || taskNameInput.value.trim().length === 0 || selectedUser === null;
  };

  const searchUsers = async (): Promise<void> => {
    const value = searchValue.value.trim();

    selectedUser = null;
    selectedUserDisplay.textContent = "";
    selectedUserDisplay.hidden = true;
    results.replaceChildren();
    updateSubmitButton();

    if (!value) {
      showFeedback("Digite um texto para buscar.");
      return;
    }

    const filters: UserSearchFilters = {};

    switch (searchField.value) {
      case "name":
        filters.name = value;
        break;
      case "email":
        filters.email = value;
        break;
      case "job_title":
        filters.job_title = value;
        break;
      case "city":
        filters.city = value;
        break;
      case "state":
        filters.state = value;
        break;
      case "bio":
        filters.bio = value;
        break;
      default:
        showFeedback("Selecione um campo de busca válido.");
        return;
    }

    showFeedback("");
    updateSubmitButton();
    searchButton.disabled = true;
    searchField.disabled = true;
    searchValue.disabled = true;

    try {
      const response = await userSearchApi(filters, 1, 10);
      userSearchResultsRender(results, response.data, response.total, (user) => {
        selectedUser = user;
        selectedUserDisplay.textContent = `Atribuir para: ${user.name} (${user.email})`;
        selectedUserDisplay.hidden = false;
        showFeedback("");
        updateSubmitButton();
      });
    } catch (error) {
      showFeedback(getErrorMessage(error, "Não foi possível buscar usuários. Tente novamente."));
    } finally {
      searchButton.disabled = false;
      searchField.disabled = false;
      searchValue.disabled = false;
    }
  };

  searchButton.addEventListener("click", () => {
    void searchUsers();
  });

  searchValue.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void searchUsers();
  });

  taskNameInput.addEventListener("input", updateSubmitButton);

  submitButton.addEventListener("click", async () => {
    const name = taskNameInput.value.trim();

    if (!name || selectedUser === null) {
      showFeedback("Preencha o nome da tarefa e escolha um usuário.");
      updateSubmitButton();
      return;
    }

    const assignedUser = selectedUser;
    isSubmitting = true;
    taskNameInput.disabled = true;
    searchField.disabled = true;
    searchValue.disabled = true;
    searchButton.disabled = true;
    updateSubmitButton();

    try {
      await taskCreateApi(assignedUser.id, { name });
    } catch (error) {
      showFeedback(getErrorMessage(error, "Não foi possível criar a tarefa. Tente novamente."));
      isSubmitting = false;
      taskNameInput.disabled = false;
      searchField.disabled = false;
      searchValue.disabled = false;
      searchButton.disabled = false;
      updateSubmitButton();
      return;
    }

    isSubmitting = false;
    taskNameInput.disabled = false;
    searchField.disabled = false;
    searchValue.disabled = false;
    searchButton.disabled = false;
    taskNameInput.value = "";
    searchField.value = "name";
    searchValue.value = "";
    selectedUser = null;
    selectedUserDisplay.textContent = "";
    selectedUserDisplay.hidden = true;
    results.replaceChildren();
    showFeedback("");
    updateSubmitButton();

    successMessage.className = "container mb-3 alert alert-success";
    successMessage.textContent = `Tarefa criada para ${assignedUser.name}.`;
    successMessage.hidden = false;
    cancelButton.click();

    if (assignedUser.id === currentUserId) {
      try {
        await tasksListRender(currentUserId);
      } catch (error) {
        console.error("Tarefa criada, mas não foi possível atualizar a lista:", error);
        successMessage.className = "container mb-3 alert alert-warning";
        successMessage.textContent = "Tarefa criada, mas não foi possível atualizar a lista. Recarregue a página.";
      }
    }
  });
}
