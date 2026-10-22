import type { User, PaginatedResponse } from "../types/api";

/**
 * TF 07 — Renderiza os resultados da busca de usuários.
 *
 * Recebe os dados da API e uma função que será executada
 * quando o usuário clicar no botão "Escolher".
 */
export default function userSearchResultsRender(
  response: PaginatedResponse<User>,
  onSelect: (user: User) => void
): void {
  const container = document.querySelector<HTMLDivElement>(
    "#assign-search-results"
  );

  if (!container) {
    return;
  }

  container.replaceChildren();

  const total = document.createElement("p");
  total.className = "fw-bold";
  total.textContent = `Total encontrado: ${response.total}`;
  container.appendChild(total);

  if (response.data.length === 0) {
    const message = document.createElement("p");
    message.className = "text-muted";
    message.textContent = "Nenhum usuário encontrado.";
    container.appendChild(message);
    return;
  }

  const list = document.createElement("div");
  list.className = "list-group";

  response.data.forEach((user: User) => {
    const item = document.createElement("div");
    item.className =
      "list-group-item d-flex justify-content-between align-items-center gap-3";

    const details = document.createElement("div");

    const name = document.createElement("strong");
    name.textContent = user.name;

    const email = document.createElement("div");
    email.className = "small text-muted";
    email.textContent = user.email;

    const job = document.createElement("div");
    job.className = "small";
    job.textContent = `Cargo: ${user.job_title ?? "Não informado"}`;

    const location = document.createElement("div");
    location.className = "small";
    location.textContent =
      `Localização: ${user.city ?? "Não informada"} / ${user.state ?? "--"}`;

    details.append(name, email, job, location);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline-primary btn-sm";
    button.textContent = "Escolher";

    button.addEventListener("click", () => {
      onSelect(user);
    });

    item.append(details, button);
    list.appendChild(item);
  });

  container.appendChild(list);
}
