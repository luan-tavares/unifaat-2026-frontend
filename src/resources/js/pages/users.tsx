import { createRoot } from "react-dom/client"
import type { PaginatedResponse, User } from "../types/api"
import { UsersApp } from "../components/UsersApp"

// A View (resources/views/users.ejs) entrega o nome do usuário logado e a
// primeira página de usuários, já lida do banco, nos data-* do #root.
const root = document.getElementById("root")!
const userName = root.dataset.userName ?? ""
const initialUsers: PaginatedResponse<User> = JSON.parse(root.dataset.initialUsers ?? "{}")

createRoot(root).render(<UsersApp userName={userName} initialUsers={initialUsers} />)
