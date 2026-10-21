import type { PaginatedResponse, User } from "../types/api";
import type { UserListItemElement } from "../types/dom";

export default function userSearchResultsRender(
  result: PaginatedResponse<User>,
  onChoose: (user: User) => void
): void {
  const container = document.querySelector("#assign-search-results");

  if (!container) return;

  container.innerHTML = "";

  if (result.data.length === 0) {
    const emptyElement = document.createElement("p");
    emptyElement.classList.add("text-muted", "m-0");
    emptyElement.innerText = "Nenhum usuário encontrado";
    container.append(emptyElement);
    return;
  }

  let totalLabel = "usuários encontrados";

  if (result.total === 1) {
    totalLabel = "usuário encontrado";
  }

  const totalElement = document.createElement("p");
  totalElement.classList.add("small", "text-muted", "mb-2");
  totalElement.innerText = `${result.total} ${totalLabel}`;

  const ulElement = document.createElement("ul");
  ulElement.classList.add("list-group");

  result.data.forEach((user) => {
    const liElement = document.createElement("li") as UserListItemElement;
    liElement.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center", "gap-2");
    liElement.userId = user.id;

    const infoElement = document.createElement("div");

    const nameElement = document.createElement("strong");
    nameElement.classList.add("d-block");
    nameElement.innerText = user.name;

    const location = [user.city, user.state].filter(Boolean).join("/");

    const detailsElement = document.createElement("small");
    detailsElement.classList.add("text-muted");
    detailsElement.innerText = [user.email, user.job_title, location].filter(Boolean).join(" · ");

    infoElement.append(nameElement, detailsElement);

    const chooseButton = document.createElement("button");
    chooseButton.type = "button";
    chooseButton.classList.add("btn", "btn-outline-primary", "btn-sm");
    chooseButton.innerText = "Escolher";
    chooseButton.addEventListener("click", () => onChoose(user));

    liElement.append(infoElement, chooseButton);
    ulElement.append(liElement);
  });

  container.append(totalElement, ulElement);
}
