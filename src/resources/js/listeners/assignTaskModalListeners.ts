import { userSearchApi } from "../api/userSearchApi";
import { taskCreateApi } from "../api/taskCreateApi";
import tasksListRender from "../render/tasksListRender";
import userSearchResultsRender from "../render/userSearchResultsRender";
import type { User, UserSearchFilters } from "../types/api";

export default function assignTaskModalListeners(idUser: number): void {
  const searchBtn = document.querySelector<HTMLButtonElement>("#assign-search-btn");
  const searchField = document.querySelector<HTMLSelectElement>("#assign-search-field");
  const searchValue = document.querySelector<HTMLInputElement>("#assign-search-value");
  const resultsContainer = document.querySelector<HTMLDivElement>("#assign-search-results");
  const selectedUserEl = document.querySelector<HTMLDivElement>("#assign-selected-user");
  const taskNameInput = document.querySelector<HTMLInputElement>("#assign-task-name");
  const submitBtn = document.querySelector<HTMLButtonElement>("#assign-task-submit");
  const modalEl = document.querySelector<HTMLElement>("#assign-task-modal");
  const feedbackEl = document.querySelector<HTMLDivElement>("#assign-modal-feedback");

  if (
    !searchBtn || !searchField || !searchValue || !resultsContainer ||
    !selectedUserEl || !taskNameInput || !submitBtn || !modalEl || !feedbackEl
  ) return;

  let selectedUser: User | null = null;

  // ── Buscar usuário ─────────────────────────────────────────
  const runSearch = async () => {
    const field = searchField.value;
    const value = searchValue.value.trim();

    if (!value) {
      resultsContainer.innerHTML = "<p class=\"text-warning small mt-2\">Digite algo para buscar.</p>";
      return;
    }

    const filters: UserSearchFilters = { [field]: value };

    try {
      const result = await userSearchApi(filters, 1, 10);
      userSearchResultsRender(result.data, result.total, resultsContainer, (user) => {
        selectedUser = user;
        selectedUserEl.innerHTML = `<span class="text-success">✓ Atribuir para: <strong>${user.name}</strong> (${user.email})</span>`;
        resultsContainer.innerHTML = "";
      });
    } catch {
      resultsContainer.innerHTML = "<p class=\"text-danger small mt-2\">Erro ao buscar usuários. Tente novamente.</p>";
    }
  };

  searchBtn.addEventListener("click", runSearch);

  searchValue.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") runSearch();
  });

  // ── Criar tarefa ───────────────────────────────────────────
  submitBtn.addEventListener("click", async () => {
    const taskName = taskNameInput.value.trim();
    feedbackEl.innerHTML = "";
    feedbackEl.classList.add("d-none");

    if (!taskName) {
      feedbackEl.innerText = "Digite o nome da tarefa.";
      feedbackEl.classList.remove("d-none");
      return;
    }

    if (!selectedUser) {
      feedbackEl.innerText = "Escolha um usuário para atribuir a tarefa.";
      feedbackEl.classList.remove("d-none");
      return;
    }

    try {
      await taskCreateApi(selectedUser.id, { name: taskName });

      // Se atribuiu para si mesmo, recarrega a lista
      if (selectedUser.id === idUser) {
        await tasksListRender(idUser);
      }

      // Feedback de sucesso e reset
      const userName = selectedUser.name;
      feedbackEl.innerHTML = `<span class="text-success">✓ Tarefa criada para <strong>${userName}</strong>!</span>`;
      feedbackEl.classList.remove("d-none");

      taskNameInput.value = "";
      selectedUser = null;
      selectedUserEl.innerHTML = "";
      resultsContainer.innerHTML = "";
      searchValue.value = "";

      // Fecha o modal após 1.5s
      setTimeout(() => {
        const closeBtn = modalEl.querySelector<HTMLButtonElement>("[data-bs-dismiss=\"modal\"]");
        closeBtn?.click();
        feedbackEl.classList.add("d-none");
      }, 1500);
    } catch {
      feedbackEl.innerText = "Erro ao criar tarefa. Tente novamente.";
      feedbackEl.classList.remove("d-none");
    }
  });

  // ── Limpar ao fechar o modal ───────────────────────────────
  modalEl.addEventListener("hidden.bs.modal", () => {
    taskNameInput.value = "";
    searchValue.value = "";
    resultsContainer.innerHTML = "";
    selectedUserEl.innerHTML = "";
    feedbackEl.classList.add("d-none");
    selectedUser = null;
  });
}
