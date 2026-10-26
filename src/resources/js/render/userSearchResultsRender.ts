import type { User } from "../types/api";

/**
 * Renderiza a lista de resultados da busca de usuários no modal de atribuição.
 *
 * @param container  Elemento #assign-search-results
 * @param users      Array de usuários retornados pela API (ou null = ainda não buscou)
 * @param total      Total de registros encontrados (para exibir o contador)
 * @param selectedId ID do usuário já escolhido (botão fica desabilitado)
 * @param onChoose   Callback disparado ao clicar em "Escolher"
 */
export default function userSearchResultsRender(
  container: HTMLElement,
  users: User[] | null,
  total: number,
  selectedId: number | null,
  onChoose: (user: User) => void
): void {
  container.innerHTML = "";

  // null = ainda não buscou; não desenha nada
  if (users === null) return;

  if (users.length === 0) {
    const emptyEl = document.createElement("p");
    emptyEl.classList.add("text-muted", "mb-0");
    emptyEl.innerText = "Nenhum usuário encontrado.";
    container.append(emptyEl);
    return;
  }

  // Contador de resultados
  const countEl = document.createElement("p");
  countEl.classList.add("small", "text-muted", "mb-2");
  countEl.innerText = `${total} usuário(s) encontrado(s)`;
  container.append(countEl);

  const ulEl = document.createElement("ul");
  ulEl.classList.add("list-group");

  for (const user of users) {
    const isSelected = user.id === selectedId;

    const liEl = document.createElement("li");
    liEl.classList.add(
      "list-group-item",
      "d-flex",
      "justify-content-between",
      "align-items-center"
    );

    // Informações do usuário
    const infoEl = document.createElement("span");

    const nameEl = document.createElement("strong");
    nameEl.innerText = user.name;

    const emailEl = document.createTextNode(` · ${user.email}`);

    const detailEl = document.createElement("small");
    detailEl.classList.add("d-block", "text-muted");
    detailEl.innerText = `${user.job_title ?? "sem cargo"} · ${user.city ?? "sem cidade"}/${user.state ?? "--"}`;

    infoEl.append(nameEl, emailEl, detailEl);

    // Botão Escolher
    const btnEl = document.createElement("button");
    btnEl.type = "button";
    btnEl.classList.add("btn", "btn-sm", "btn-outline-primary");
    btnEl.innerText = isSelected ? "Escolhido" : "Escolher";
    btnEl.disabled = isSelected;

    if (!isSelected) {
      btnEl.addEventListener("click", () => onChoose(user));
    }

    liEl.append(infoEl, btnEl);
    ulEl.append(liEl);
  }

  container.append(ulEl);
}
