import taskRender from "./taskRender";
import { tasksListApi } from "../api/tasksListApi";

export default async function tasksListRender(idUser: number, page = 1, limit = 10): Promise<void> {
  const container = document.querySelector("#tasks-container");

  if (!container) return;

  container.innerHTML = "Carregando...";

  try {
    const listApi = await tasksListApi(page);

    container.innerHTML = "";

    const ulElement = document.createElement("ul");
    ulElement.id = "tasks-list";
    ulElement.classList.add("list-group");
    container.append(ulElement);

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
    
    const divPaginacao = document.createElement("div");
    divPaginacao.classList.add("d-flex", "justify-content-between", "align-items-center", "mt-3");

    const btnAnterior = document.createElement("button");
    btnAnterior.innerText = "Anterior";
    btnAnterior.classList.add("btn", "btn-outline-primary", "btn-sm");
    btnAnterior.disabled = listApi.page === 1;
    btnAnterior.addEventListener("click", () => {
      tasksListRender(idUser, listApi.page - 1, limit);
    });

    const spanPagina = document.createElement("span");
    spanPagina.innerText = `Página ${listApi.page}`;
    spanPagina.classList.add("text-muted", "small");

    const btnProxima = document.createElement("button");
    btnProxima.innerText = "Próxima";
    btnProxima.classList.add("btn", "btn-outline-primary", "btn-sm");
    
    const hasNextPage = (listApi.page * listApi.limit) < listApi.total;
    btnProxima.disabled = !hasNextPage;
    btnProxima.addEventListener("click", () => {
      tasksListRender(idUser, listApi.page + 1, limit);
    });
  
    divPaginacao.append(btnAnterior, spanPagina, btnProxima);
    container.append(divPaginacao);

  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="alert alert-danger mt-3">Erro ao carregar a lista de tarefas.</div>`;
  }
}