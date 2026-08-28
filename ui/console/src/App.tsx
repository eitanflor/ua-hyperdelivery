import { useEffect, useState } from "react";
import { MsalProvider } from "@azure/msal-react";
import { BrowserRouter, Route, Routes, useMatch } from "react-router";
import { MotionConfig } from "motion/react";
import { ProjectRail } from "./components/shell/ProjectRail";
import { TopBar } from "./components/shell/TopBar";
import { CommandPalette } from "./components/shell/CommandPalette";
import { ErrorToast } from "./components/ErrorToast";
import { TooltipProvider } from "./components/ui/Tooltip";
import { Landing } from "./routes/Landing";
import { Workspace } from "./routes/Workspace";
import { useProjectsStore } from "./store/useProjectsStore";
import { AuthGate } from "./auth/AuthGate";
import { msalInstance } from "./auth/msalConfig";

/** Below this the rail and the inspector together squeeze the reading column past its
 * measure floor, so the rail starts collapsed. Above it, both panels fit. */
const RAIL_BREAKPOINT = "(min-width: 1180px)";

function Shell() {
  const match = useMatch("/projects/:projectId");
  const projectId = match?.params.projectId;
  const project = useProjectsStore((s) => (projectId ? (s.projects[projectId] ?? null) : null));
  const pendingByStation = useProjectsStore((s) => s.pendingByStation);

  const [railOpen, setRailOpen] = useState(() => window.matchMedia(RAIL_BREAKPOINT).matches);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const needsYouCount =
    (pendingByStation.blueprint_approval?.length ?? 0) +
    (pendingByStation.review_approval?.length ?? 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setRailOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-dvh flex-col bg-canvas text-fg">
      <TopBar
        project={project}
        needsYouCount={needsYouCount}
        railOpen={railOpen}
        onToggleRail={() => setRailOpen((open) => !open)}
        onOpenPalette={() => setPaletteOpen(true)}
      />
      <div className="flex min-h-0 flex-1">
        <ProjectRail open={railOpen} />
        <main className="min-w-0 flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/projects/:projectId" element={<Workspace />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <ErrorToast />
    </div>
  );
}

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthGate>
        <TooltipProvider>
          {/* motion follows the OS setting rather than being overridden per-component */}
          <MotionConfig reducedMotion="user">
            <BrowserRouter>
              <Shell />
            </BrowserRouter>
          </MotionConfig>
        </TooltipProvider>
      </AuthGate>
    </MsalProvider>
  );
}

export default App;



