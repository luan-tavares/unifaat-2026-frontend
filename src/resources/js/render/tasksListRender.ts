import taskRender from "./taskRender";
import { tasksListApi } from "../api/tasksListApi";

export default async function tasksListRender(idUser: number, page = 1): Promise<void> {
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
      const liElement = taskRender(task, idUser);
      ulElement.append(liElement);
    });
  }

  // Paginação
  const totalPages = Math.ceil(listApi.total / listApi.limit);

  if (totalPages <= 1) return;

  const paginationDiv = document.createElement("div");
  paginationDiv.classList.add("d-flex", "justify-content-between", "align-items-center", "mt-2");

  const prevButton = document.createElement("button");
  prevButton.classList.add("btn", "btn-outline-secondary", "btn-sm");
  prevButton.innerText = "← Anterior";
  prevButton.disabled = page <= 1;
  prevButton.addEventListener("click", () => tasksListRender(idUser, page - 1));

  const pageInfo = document.createElement("span");
  pageInfo.classList.add("text-muted", "small");
  pageInfo.innerText = `Página ${page} de ${totalPages}`;

  const nextButton = document.createElement("button");
  nextButton.classList.add("btn", "btn-outline-secondary", "btn-sm");
  nextButton.innerText = "Próxima →";
  nextButton.disabled = page >= totalPages;
  nextButton.addEventListener("click", () => tasksListRender(idUser, page + 1));

  paginationDiv.append(prevButton, pageInfo, nextButton);
  container.append(paginationDiv);
}
