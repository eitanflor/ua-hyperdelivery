import { useEffect, useState } from "react";
import { MsalProvider } from "@azure/msal-react";
import { BrowserRouter, Route, Routes, useLocation, useMatch } from "react-router";
import { MotionConfig } from "motion/react";
import { ProjectRail } from "./components/shell/ProjectRail";
import { TopBar } from "./components/shell/TopBar";
import { CommandPalette } from "./components/shell/CommandPalette";
import { ErrorToast } from "./components/ErrorToast";
import { Notices } from "./components/Notices";
import { HelpPanel } from "./components/help/HelpPanel";
import { TooltipProvider } from "./components/ui/Tooltip";
import { Home } from "./routes/Home";
import { Answer } from "./routes/Answer";
import { Landing } from "./routes/Landing";
import { NotFound } from "./routes/NotFound";
import { Portfolio } from "./routes/Portfolio";
import { Settings } from "./routes/Settings";
import { Workspace } from "./routes/Workspace";
import { Context } from "./routes/Context";
import { useProjectsStore } from "./store/useProjectsStore";
import { useTabBadge } from "./lib/favicon";
import { AGENT_META } from "./lib/pipeline";
import { AuthGate } from "./auth/AuthGate";
import { msalInstance } from "./auth/msalConfig";

/** Below this the rail and the inspector together squeeze the reading column past its
 * measure floor, so the rail starts collapsed. Above it, both panels fit. */
const RAIL_BREAKPOINT = "(min-width: 1180px)";

/** The tab title for each page, so history, bookmarks and a row of tabs say where each one is. */
const PAGE_TITLE: Record<string, string> = {
  "/": "Home",
  "/start": "Start a project",
  "/portfolio": "Portfolio",
  "/context": "Workspace notes",
  "/settings": "Settings",
};

function Shell() {
  const match = useMatch("/projects/:projectId");
  const projectId = match?.params.projectId;
  const location = useLocation();
  const project = useProjectsStore((s) => (projectId ? (s.projects[projectId] ?? null) : null));
  const pendingByStation = useProjectsStore((s) => s.pendingByStation);
  const working = useProjectsStore((s) => s.runningProjectId !== null);
  const workingAgent = useProjectsStore((s) => {
    const running = s.runningProjectId ? s.projects[s.runningProjectId] : undefined;
    return running ? (AGENT_META[running.station]?.name ?? null) : null;
  });

  const [railOpen, setRailOpen] = useState(() => window.matchMedia(RAIL_BREAKPOINT).matches);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const needsYouCount =
    (pendingByStation.blueprint_approval?.length ?? 0) +
    (pendingByStation.review_approval?.length ?? 0) +
    (pendingByStation.showroom_approval?.length ?? 0);

  useTabBadge({
    waiting: needsYouCount,
    working,
    activity: workingAgent ? `${workingAgent} is working` : null,
    title: project?.name ?? PAGE_TITLE[location.pathname] ?? (projectId ? undefined : "Not found"),
  });

  useEffect(() => {
    // the landing page tags this navigation so the rail (open by default while there is
    // nothing to browse yet) gets out of the way of the conversation it just started
    if ((location.state as { justCreated?: boolean } | null)?.justCreated) setRailOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

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
      <a
        href="#main"
        className="sr-only rounded-sm bg-overlay px-3 py-2 text-xs font-medium text-fg shadow-overlay focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60]"
      >
        Skip to content
      </a>
      <TopBar
        project={project}
        needsYouCount={needsYouCount}
        railOpen={railOpen}
        onToggleRail={() => setRailOpen((open) => !open)}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />
      <div className="flex min-h-0 flex-1">
        <ProjectRail open={railOpen} />
        <main id="main" tabIndex={-1} className="min-w-0 flex-1 overflow-hidden outline-none">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/start" element={<Landing />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/projects/:projectId" element={<Workspace />} />
            <Route path="/context" element={<Context />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onOpenHelp={() => setHelpOpen(true)}
      />
      <HelpPanel open={helpOpen} onOpenChange={setHelpOpen} />
      <Notices viewingProjectId={projectId} />
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
              <Routes>
                {/* outside the shell on purpose: no rail, no top bar, just the questions */}
                <Route path="/answer/:projectId" element={<Answer />} />
                <Route path="*" element={<Shell />} />
              </Routes>
            </BrowserRouter>
          </MotionConfig>
        </TooltipProvider>
      </AuthGate>
    </MsalProvider>
  );
}

export default App;
