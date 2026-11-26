import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { DeadlinesProvider } from "./context/DeadlinesContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <DeadlinesProvider>
        <App />
      </DeadlinesProvider>
    </BrowserRouter>
  </StrictMode>
);