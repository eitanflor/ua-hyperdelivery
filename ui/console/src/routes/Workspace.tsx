import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { SidebarSimpleIcon } from "@phosphor-icons/react";
import { useProjectsStore } from "../store/useProjectsStore";
import { usePreferences } from "../store/usePreferences";
import type { Artifact } from "../api/types";
import { Thread } from "../components/thread/Thread";
import { Inspector } from "../components/inspector/Inspector";
import { IconButton } from "../components/ui/IconButton";
import { Kickoff } from "../components/moments/Kickoff";

const NO_ARTIFACTS: Artifact[] = [];

/** Open by default wherever there is room for it beside a readable chat column. */
const WIDE = "(min-width: 1024px)";

export function Workspace() {
  const { projectId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const artifacts = useProjectsStore((s) => s.artifactsByProject[projectId] ?? NO_ARTIFACTS);
  const artifactsLoaded = useProjectsStore((s) => s.artifactsByProject[projectId] !== undefined);
  const loadProject = useProjectsStore((s) => s.loadProject);
  const loadArtifacts = useProjectsStore((s) => s.loadArtifacts);
  const loadDecisions = useProjectsStore((s) => s.loadDecisions);
  const loadTurns = useProjectsStore((s) => s.loadTurns);

  // in the URL, so a copied link reopens the same document at the same section
  const panel = params.get("panel") ?? "progress";
  const section = params.get("section") ?? undefined;
  const [open, setOpen] = useState(() => window.matchMedia(WIDE).matches || params.has("panel"));

  // the first project this browser creates gets a kickoff; every later one goes straight in
  const location = useLocation();
  const markKickoffSeen = usePreferences((s) => s.markKickoffSeen);
  const [kickoff, setKickoff] = useState(
    () =>
      Boolean((location.state as { justCreated?: boolean } | null)?.justCreated) &&
      !usePreferences.getState().kickoffSeen,
  );
  const dismissKickoff = useCallback(() => setKickoff(false), []);
  useEffect(() => {
    if (kickoff) markKickoffSeen();
  }, [kickoff, markKickoffSeen]);

  const showPanel = useCallback(
    (next: string, nextSection?: string | null) =>
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          if (next === "progress") out.delete("panel");
          else out.set("panel", next);
          if (nextSection) out.set("section", nextSection);
          else out.delete("section");
          return out;
        },
        { replace: true },
      ),
    [setParams],
  );

  useEffect(() => {
    void loadProject(projectId);
    void loadArtifacts(projectId);
    void loadDecisions(projectId);
    void loadTurns(projectId);
  }, [projectId, loadProject, loadArtifacts, loadDecisions, loadTurns]);

  // follow a document as it lands - but only one that is new since this project's list
  // first loaded, so a link to Progress or to another document is not overridden
  const known = useRef<{ projectId: string; count: number } | null>(null);
  useEffect(() => {
    if (!artifactsLoaded) return;
    const previous = known.current;
    known.current = { projectId, count: artifacts.length };
    if (previous?.projectId !== projectId || artifacts.length <= previous.count) return;
    const newest = [...artifacts].sort((a, b) => a.created_at.localeCompare(b.created_at)).at(-1);
    if (!newest) return;
    const frame = requestAnimationFrame(() => {
      showPanel(newest.agent);
      setOpen(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [artifactsLoaded, artifacts, projectId, showPanel]);

  const openArtifact = (agent: string) => {
    showPanel(agent);
    setOpen(true);
  };

  return (
    <div className="flex h-full min-w-0">
      {/* Thread owns its own scroll region so the composer footer can stay fixed to the
          bottom instead of scrolling with it. */}
      <div className="relative flex min-h-0 min-w-[24rem] flex-1 flex-col">
        <Thread projectId={projectId} onViewArtifact={openArtifact} />
        <AnimatePresence>
          {kickoff && (
            <motion.div
              key="kickoff"
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 top-8 z-30 flex justify-center"
            >
              <Kickoff onDone={dismissKickoff} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {open ? (
        <Inspector
          projectId={projectId}
          artifacts={artifacts}
          panel={panel}
          section={section}
          onPanel={(next) => showPanel(next)}
          onSection={(id) => showPanel(panel, id)}
          onClose={() => setOpen(false)}
        />
      ) : (
        <div className="shrink-0 border-l border-line-subtle p-2">
          <IconButton
            label="Show progress and documents"
            icon={<SidebarSimpleIcon className="size-3.5 scale-x-[-1]" />}
            size="sm"
            onClick={() => setOpen(true)}
          />
        </div>
      )}
    </div>
  );
}
