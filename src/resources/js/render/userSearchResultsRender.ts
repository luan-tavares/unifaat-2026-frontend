import type { User } from "../types/api";

/**
 * Renderiza os resultados da busca de usuários no container do modal.
 * Cada item tem um botão "Escolher" que chama o callback onSelect com o usuário.
 */
export default function userSearchResultsRender(
  users: User[],
  total: number,
  container: HTMLElement,
  onSelect: (user: User) => void
): void {
  container.innerHTML = "";

  if (users.length === 0) {
    const empty = document.createElement("p");
    empty.classList.add("text-muted", "text-center", "mt-2");
    empty.innerText = "Nenhum usuário encontrado.";
    container.append(empty);
    return;
  }

  const totalEl = document.createElement("p");
  totalEl.classList.add("text-muted", "small", "mb-2");
  totalEl.innerText = `${total} usuário${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}.`;
  container.append(totalEl);

  const ul = document.createElement("ul");
  ul.classList.add("list-group");

  for (const user of users) {
    const li = document.createElement("li");
    li.classList.add(
      "list-group-item",
      "d-flex",
      "justify-content-between",
      "align-items-center",
      "gap-2"
    );

    const info = document.createElement("div");
    info.classList.add("d-flex", "flex-column");

    const name = document.createElement("span");
    name.classList.add("fw-semibold");
    name.innerText = user.name;

    const email = document.createElement("span");
    email.classList.add("text-muted", "small");
    email.innerText = user.email;

    const details = document.createElement("span");
    details.classList.add("text-muted", "small");
    const parts: string[] = [];
    if (user.job_title) parts.push(user.job_title);
    if (user.city && user.state) parts.push(`${user.city}/${user.state}`);
    else if (user.city) parts.push(user.city);
    details.innerText = parts.join(" · ");

    info.append(name, email);
    if (parts.length > 0) info.append(details);

    const btn = document.createElement("button");
    btn.classList.add("btn", "btn-outline-primary", "btn-sm", "flex-shrink-0");
    btn.innerText = "Escolher";
    btn.addEventListener("click", () => onSelect(user));

    li.append(info, btn);
    ul.append(li);
  }

  container.append(ul);
}
