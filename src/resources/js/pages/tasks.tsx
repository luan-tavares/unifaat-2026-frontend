import { createRoot } from "react-dom/client"
import type { Task } from "../types/api"
import { TaskApp } from "../components/TaskApp"

// A View (resources/views/tasks.ejs) entrega o id do usuário e as tasks
// já lidas do banco nos data-* do #root; o React só monta o componente.
const root = document.getElementById("root")!
const idUser = Number(root.dataset.idUser)
const userName = root.dataset.userName ?? ""
const initialTasks: Task[] = JSON.parse(root.dataset.tasks ?? "[]")

createRoot(root).render(<TaskApp idUser={idUser} userName={userName} initialTasks={initialTasks} />)
