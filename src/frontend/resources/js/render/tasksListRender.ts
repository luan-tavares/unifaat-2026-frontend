import taskRender from "./taskRender";
import { tasksListApi } from "../api/tasksListApi";

export default async function tasksListRender(page = 1): Promise<void> {
  const container = document.querySelector("#tasks-container");

  if (!container) return;

  container.innerHTML = "";

  const ulElement = document.createElement("ul");
  ulElement.id = "tasks-list";
  ulElement.classList.add("list-group");

  container.append(ulElement);

  const listApi = await tasksListApi({ page });

  ulElement.innerHTML = "";

  if (listApi.data.length === 0) {
    const emptyElement = document.createElement("li");
    emptyElement.classList.add("list-group-item", "text-center", "text-muted");
    emptyElement.innerText = "Nenhuma tarefa encontrada. Crie uma nova!";
    ulElement.append(emptyElement);
  } else {
    listApi.data.forEach((task) => {
      const liElement = taskRender(task);
      ulElement.append(liElement);
    });
  }

  // ── Paginação ───────────────────────────────────────────────
  const totalPages = Math.ceil(listApi.total / listApi.limit);

  if (totalPages <= 1) return;

  const paginationWrapper = document.createElement("div");
  paginationWrapper.classList.add("d-flex", "justify-content-between", "align-items-center", "mt-3");

  // Botão Anterior
  const prevButton = document.createElement("button");
  prevButton.classList.add("btn", "btn-outline-primary", "btn-sm");
  prevButton.innerText = "← Anterior";
  prevButton.disabled = page <= 1;
  prevButton.addEventListener("click", () => tasksListRender(page - 1));

  // Indicador de página
  const pageInfo = document.createElement("span");
  pageInfo.classList.add("text-muted", "small");
  pageInfo.innerText = `Página ${page} de ${totalPages}`;

  // Botão Próxima
  const nextButton = document.createElement("button");
  nextButton.classList.add("btn", "btn-outline-primary", "btn-sm");
  nextButton.innerText = "Próxima →";
  nextButton.disabled = page >= totalPages;
  nextButton.addEventListener("click", () => tasksListRender(page + 1));

  paginationWrapper.append(prevButton, pageInfo, nextButton);
  container.append(paginationWrapper);
}
