import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App.tsx";
import "./index.css";

const raiz = document.getElementById("root");

if (raiz === null) {
  throw new Error('index.html precisa de um elemento com id="root"');
}

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
