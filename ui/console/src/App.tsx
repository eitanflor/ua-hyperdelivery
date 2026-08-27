import { useState } from "react";
import { MsalProvider } from "@azure/msal-react";
import { Sidebar } from "./components/Sidebar";
import { ProjectWorkspace } from "./components/ProjectWorkspace";
import { LandingComposer } from "./components/LandingComposer";
import { ErrorToast } from "./components/ErrorToast";
import { AuthGate } from "./auth/AuthGate";
import { msalInstance } from "./auth/msalConfig";

function App() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  return (
    <MsalProvider instance={msalInstance}>
      <AuthGate>
        <div className="flex h-screen bg-white">
          <Sidebar selectedId={selectedProjectId} onSelect={setSelectedProjectId} />
          <main className="flex-1 overflow-hidden bg-white">
            {selectedProjectId ? (
              <ProjectWorkspace key={selectedProjectId} projectId={selectedProjectId} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center animate-fade-in">
                <img src="/ua-logo.png" alt="Under Armour" className="h-20 w-20 object-contain" />
                <div>
                  <p className="text-lg font-semibold text-ua-black">What are we building?</p>
                  <p className="mt-1 max-w-xs text-sm text-ua-steel">
                    Describe it below to start a new project, or pick one from the sidebar.
                  </p>
                </div>
                <LandingComposer onCreated={setSelectedProjectId} />
              </div>
            )}
          </main>
          <ErrorToast />
        </div>
      </AuthGate>
    </MsalProvider>
  );
}

export default App;



