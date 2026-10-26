import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";
import "./index.css";

// O `!` do template seria uma afirmação sem prova: se o elemento não
// existisse, o erro apareceria como "null não tem createRoot", longe da
// causa. A verificação explícita diz o que falta.
const raiz = document.getElementById("root");

if (raiz === null) {
  throw new Error('index.html precisa de um elemento com id="root"');
}

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
