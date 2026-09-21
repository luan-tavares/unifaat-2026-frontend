import type { PaginatedResponse, Task } from "../types/api";

export default function paginationRender(
  listApi: PaginatedResponse<Task>,
  onPageChange: (page: number) => void
): HTMLElement {
  const { page, limit, total } = listApi;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const navElement = document.createElement("div");
  navElement.classList.add("d-flex", "justify-content-between", "align-items-center", "mt-3");

  const prevButton = document.createElement("button");
  prevButton.classList.add("btn", "btn-outline-primary", "btn-sm");
  prevButton.innerText = "Anterior";
  prevButton.disabled = page <= 1;
  prevButton.addEventListener("click", () => onPageChange(page - 1));

  const pageInfoElement = document.createElement("span");
  pageInfoElement.classList.add("text-muted", "small");
  pageInfoElement.innerText = `Página ${page} de ${totalPages}`;

  const nextButton = document.createElement("button");
  nextButton.classList.add("btn", "btn-outline-primary", "btn-sm");
  nextButton.innerText = "Próxima";
  nextButton.disabled = page >= totalPages;
  nextButton.addEventListener("click", () => onPageChange(page + 1));

  navElement.append(prevButton, pageInfoElement, nextButton);

  return navElement;
}
