import taskRender from "./taskRender.js";
import { tasksListApi } from "../api/tasksListApi.js";
import type { PaginatedResponse, Task } from "../types/api";

export default async function tasksListRender(
    idUser: number,
    page: number = 1
): Promise<void> {
    const container = document.querySelector("#tasks-container");

    if (!(container instanceof HTMLElement)) {
        return;
    }

    container.innerHTML = "";

    const ulElement = document.createElement("ul");
    ulElement.id = "tasks-list";
    ulElement.classList.add("list-group");

    container.append(ulElement);

    const listApi: PaginatedResponse<Task> = await tasksListApi({
        page,
        limit: 10
    });

    if (listApi.data.length === 0) {
        const emptyElement = document.createElement("li");

        emptyElement.classList.add(
            "list-group-item",
            "text-center",
            "text-muted"
        );

        emptyElement.innerText =
            "Nenhuma tarefa encontrada. Crie uma nova!";

        ulElement.append(emptyElement);
    } else {
        listApi.data.forEach((task) => {
            const liElement = taskRender(task, idUser);
            ulElement.append(liElement);
        });
    }

    const paginationElement = document.createElement("div");

    paginationElement.classList.add(
        "d-flex",
        "justify-content-center",
        "gap-2",
        "mt-3"
    );

    const previousButton = document.createElement("button");

    previousButton.classList.add(
        "btn",
        "btn-outline-primary"
    );

    previousButton.innerText = "Anterior";
    previousButton.disabled = listApi.page <= 1;

    previousButton.addEventListener("click", async () => {
        await tasksListRender(idUser, listApi.page - 1);
    });

    const nextButton = document.createElement("button");

    nextButton.classList.add(
        "btn",
        "btn-outline-primary"
    );

    nextButton.innerText = "Proxima";

    const lastPage = Math.ceil(
        listApi.total / listApi.limit
    );

    nextButton.disabled = listApi.page >= lastPage;

    nextButton.addEventListener("click", async () => {
        await tasksListRender(idUser, listApi.page + 1);
    });

    paginationElement.append(
        previousButton,
        nextButton
    );

    container.append(paginationElement);
}