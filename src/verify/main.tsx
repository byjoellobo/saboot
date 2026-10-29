import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "../app/styles.css";
import { VerifyApp } from "./VerifyApp";

if (!import.meta.env.DEV) registerSW({ immediate: true });

const container = document.getElementById("root");
if (!container) throw new Error("Missing #root element");
createRoot(container).render(
  <StrictMode>
    <VerifyApp />
  </StrictMode>,
);
