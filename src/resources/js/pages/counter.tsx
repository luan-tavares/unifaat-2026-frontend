import { createRoot } from "react-dom/client"
import { Counter } from "../components/Counter"

// A View (resources/views/counter.ejs) entrega o #root; o contador é um componente.
createRoot(document.getElementById("root")!).render(<Counter />)
