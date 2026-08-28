import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./index.css";
import App from "./App.tsx";
import { msalInstance } from "./auth/msalConfig";
import { initTheme } from "./store/useTheme";

// msal-browser requires initialize() before any other API call, and the redirect result
// must be consumed once at startup or the login redirect back from Entra ID never resolves.
async function bootstrap() {
  const container = document.getElementById("root");
  if (!container) throw new Error("Root element #root not found.");

  initTheme();
  await msalInstance.initialize();
  await msalInstance.handleRedirectPromise();

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap().catch((error: unknown) => console.error("Bootstrap failed", error));
