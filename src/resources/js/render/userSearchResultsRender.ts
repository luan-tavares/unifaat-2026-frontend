import type { User } from "../types/api";

export default function userSearchResultsRender(
  container: HTMLElement,
  users: User[],
  total: number,
  onChoose: (user: User) => void
): void {
  container.replaceChildren();

  const summary = document.createElement("p");
  summary.classList.add("text-muted", "mb-2");
  summary.textContent = `${total} ${total === 1 ? "usuário encontrado" : "usuários encontrados"}`;
  container.append(summary);

  if (users.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.classList.add("text-muted", "mb-0");
    emptyMessage.textContent = "Nenhum usuário encontrado";
    container.append(emptyMessage);
    return;
  }

  const list = document.createElement("ul");
  list.classList.add("list-group");

  users.forEach((user) => {
    const item = document.createElement("li");
    item.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center", "gap-3");

    const details = document.createElement("div");
    details.classList.add("flex-grow-1");

    const name = document.createElement("div");
    name.classList.add("fw-semibold");
    name.textContent = user.name;

    const email = document.createElement("div");
    email.classList.add("small");
    email.textContent = user.email;

    const jobTitle = document.createElement("div");
    jobTitle.classList.add("small", "text-muted");
    jobTitle.textContent = `Cargo: ${user.job_title ?? "Não informado"}`;

    const location = document.createElement("div");
    location.classList.add("small", "text-muted");
    const city = user.city ?? "Não informada";
    const state = user.state ?? "UF não informada";
    location.textContent = `Local: ${city} / ${state}`;

    details.append(name, email, jobTitle, location);

    const chooseButton = document.createElement("button");
    chooseButton.type = "button";
    chooseButton.classList.add("btn", "btn-outline-primary", "btn-sm");
    chooseButton.textContent = "Escolher";
    chooseButton.addEventListener("click", () => onChoose(user));

    item.append(details, chooseButton);
    list.append(item);
  });

  container.append(list);
}
