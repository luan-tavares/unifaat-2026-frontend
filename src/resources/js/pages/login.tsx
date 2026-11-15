import { createRoot } from "react-dom/client"
import { LoginForm } from "../components/LoginForm"

// A View (resources/views/login.ejs) entrega o #root; o formulário é um componente.
createRoot(document.getElementById("root")!).render(<LoginForm />)
