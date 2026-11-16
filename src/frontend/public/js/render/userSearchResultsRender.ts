import type { User } from "../types/api";

export default function userSearchResultsRender(
    users: User[],
    onSelect: (user: User) => void
): void {
    const resultsElement = document.querySelector("#assign-search-results");

    if (!(resultsElement instanceof HTMLElement)) {
        return;
    }

    resultsElement.innerHTML = "";

    users.forEach((user) => {
        const item = document.createElement("li");
        item.classList.add("list-group-item", "d-flex", "justify-content-between", "align-items-center", "gap-3");

        const details = document.createElement("div");
        details.classList.add("flex-grow-1");

        const name = document.createElement("strong");
        name.innerText = user.name;

        const information = document.createElement("div");
        information.classList.add("small", "text-muted");
        const location = [user.city, user.state].filter(Boolean).join(" / ");
        information.innerText = [user.email, user.job_title, location].filter(Boolean).join(" • ");

        details.append(name, information);

        const chooseButton = document.createElement("button");
        chooseButton.type = "button";
        chooseButton.classList.add("btn", "btn-outline-primary", "btn-sm");
        chooseButton.innerText = "Escolher";
        chooseButton.addEventListener("click", () => onSelect(user));

        item.append(details, chooseButton);
        resultsElement.append(item);
    });
}
