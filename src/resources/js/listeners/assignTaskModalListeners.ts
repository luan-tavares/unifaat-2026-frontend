import type { User, UserSearchFilters } from "../types/api";
import { userSearchApi } from "../api/userSearchApi";
import { taskCreateApi } from "../api/taskCreateApi";
import { getErrorMessage } from "../utils/getErrorMessage";
import userSearchResultsRender from "../render/userSearchResultsRender";
import tasksListRender from "../render/tasksListRender";

/**
 * Registra todos os listeners do modal #assign-task-modal.
 * Deve ser chamado uma única vez, após o DOMContentLoaded.
 *
 * @param idUser ID do usuário logado (para saber se deve recarregar a lista)
 */
export default function assignTaskModalListeners(idUser: number): void {
  const modal = document.querySelector<HTMLElement>("#assign-task-modal");
  const taskNameInput = document.querySelector<HTMLInputElement>("#assign-task-name");
  const searchFieldSelect = document.querySelector<HTMLSelectElement>("#assign-search-field");
  const searchValueInput = document.querySelector<HTMLInputElement>("#assign-search-value");
  const searchBtn = document.querySelector<HTMLButtonElement>("#assign-search-btn");
  const searchResultsContainer = document.querySelector<HTMLElement>("#assign-search-results");
  const selectedUserContainer = document.querySelector<HTMLElement>("#assign-selected-user");
  const messageContainer = document.querySelector<HTMLElement>("#assign-modal-message");
  const submitBtn = document.querySelector<HTMLButtonElement>("#assign-task-submit");

  // Todos os elementos são obrigatórios; se o HTML estiver incompleto, não registra nada
  if (
    !modal ||
    !taskNameInput ||
    !searchFieldSelect ||
    !searchValueInput ||
    !searchBtn ||
    !searchResultsContainer ||
    !selectedUserContainer ||
    !messageContainer ||
    !submitBtn
  ) {
    return;
  }

  // Estado interno do modal
  let selectedUser: User | null = null;
  let lastResults: User[] = [];
  let lastTotal = 0;

  // ── Helpers ────────────────────────────────────────────────────────────────

  function showMessage(text: string, variant: "danger" | "success"): void {
    messageContainer.innerHTML = `<div class="alert alert-${variant} mb-0">${text}</div>`;
  }

  function clearMessage(): void {
    messageContainer.innerHTML = "";
  }

  function updateSubmitState(): void {
    const hasName = taskNameInput.value.trim() !== "";
    const hasUser = selectedUser !== null;
    submitBtn.disabled = !(hasName && hasUser);
  }

  function renderSelectedUser(): void {
    if (selectedUser === null) {
      selectedUserContainer.innerHTML = "";
      return;
    }

    selectedUserContainer.innerHTML = `
      <p class="mb-0">
        <strong>Atribuir para:</strong> ${selectedUser.name} (${selectedUser.email})
      </p>
    `;
  }

  function resetModal(): void {
    taskNameInput.value = "";
    searchValueInput.value = "";
    selectedUser = null;
    lastResults = [];
    lastTotal = 0;
    searchResultsContainer.innerHTML = "";
    selectedUserContainer.innerHTML = "";
    messageContainer.innerHTML = "";
    submitBtn.disabled = true;
  }

  // ── Escolher usuário da lista ──────────────────────────────────────────────

  function handleChoose(user: User): void {
    selectedUser = user;
    renderSelectedUser();
    updateSubmitState();

    // Re-renderiza resultados para atualizar o botão "Escolhido"
    userSearchResultsRender(
      searchResultsContainer,
      lastResults,
      lastTotal,
      selectedUser.id,
      handleChoose
    );
  }

  // ── Buscar usuários ────────────────────────────────────────────────────────

  async function handleSearch(): Promise<void> {
    const field = searchFieldSelect.value as keyof UserSearchFilters;
    const value = searchValueInput.value.trim();

    if (value === "") {
      showMessage("Digite algo para buscar.", "danger");
      return;
    }

    clearMessage();
    searchBtn.disabled = true;
    searchBtn.innerText = "Buscando...";

    try {
      const filters: UserSearchFilters = { [field]: value };
      const result = await userSearchApi(filters, 1, 10);

      lastResults = result.data;
      lastTotal = result.total;

      userSearchResultsRender(
        searchResultsContainer,
        result.data,
        result.total,
        selectedUser?.id ?? null,
        handleChoose
      );
    } catch (error) {
      showMessage(getErrorMessage(error, "Erro ao buscar usuários."), "danger");
    } finally {
      searchBtn.disabled = false;
      searchBtn.innerText = "Buscar";
    }
  }

  // ── Criar tarefa ───────────────────────────────────────────────────────────

  async function handleSubmit(): Promise<void> {
    const taskName = taskNameInput.value.trim();

    if (taskName === "" || selectedUser === null) return;

    clearMessage();
    submitBtn.disabled = true;
    submitBtn.innerText = "Criando...";

    try {
      await taskCreateApi(selectedUser.id, { name: taskName });

      // Se a tarefa foi criada para o próprio usuário logado, recarrega a lista
      if (selectedUser.id === idUser) {
        await tasksListRender(idUser);
      }

      // Fecha o modal via Bootstrap API
      const bsModal = (window as unknown as Record<string, unknown>).bootstrap;
      if (bsModal && typeof bsModal === "object") {
        const Modal = (bsModal as Record<string, unknown>).Modal;
        if (Modal && typeof Modal === "object") {
          const getInstance = (Modal as Record<string, unknown>).getInstance;
          if (typeof getInstance === "function") {
            const instance = (getInstance as (el: HTMLElement) => { hide(): void } | null)(modal);
            instance?.hide();
          }
        }
      }

      resetModal();

      // Exibe mensagem fora do modal (na seção de tarefas)
      const tasksContainer = document.querySelector<HTMLElement>("#tasks-container");
      if (tasksContainer) {
        const alertEl = document.createElement("div");
        alertEl.classList.add("alert", "alert-success", "mt-2");
        alertEl.innerText = `Tarefa criada para ${selectedUser.name} com sucesso!`;
        tasksContainer.prepend(alertEl);

        setTimeout(() => alertEl.remove(), 4000);
      }
    } catch (error) {
      showMessage(getErrorMessage(error, "Erro ao criar tarefa."), "danger");
      submitBtn.disabled = false;
      submitBtn.innerText = "Criar tarefa";
    }
  }

  // ── Limpar estado ao fechar o modal ───────────────────────────────────────

  modal.addEventListener("hidden.bs.modal", () => {
    resetModal();
  });

  // ── Registrar eventos ─────────────────────────────────────────────────────

  searchBtn.addEventListener("click", () => void handleSearch());

  // Buscar também ao pressionar Enter no campo de texto
  searchValueInput.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key !== "Enter") return;
    void handleSearch();
  });

  taskNameInput.addEventListener("input", () => updateSubmitState());

  submitBtn.addEventListener("click", () => void handleSubmit());
}
