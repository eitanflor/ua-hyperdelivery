import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircleIcon, XIcon } from "@phosphor-icons/react";
import type { Project } from "../api/types";
import { AGENT_META, STATION_META } from "../lib/pipeline";
import { EASE_EXIT, EASE_OUT } from "../lib/motion";
import { useNotices, type Notice } from "../store/useNotices";
import { useProjectsStore, type PendingDecision } from "../store/useProjectsStore";

const AUTO_DISMISS_MS = 6000;
/** A stopped or failed run clears `runningProjectId` a beat before `failedRun` lands. */
const SETTLE_MS = 300;

function lower(text: string | undefined, fallback: string): string {
  return (text ?? fallback).toLowerCase();
}

function runReceipt(project: Project): Omit<Notice, "id"> {
  const to = `/projects/${project.id}`;
  const meta = STATION_META[project.station];
  if (meta.kind === "done") return { title: `${project.name} shipped`, detail: "All four stages are done.", to };
  if (meta.kind === "gate") {
    const agent = AGENT_META[meta.reviewing!];
    return {
      title: `${agent?.name ?? "The crew"} finished the ${lower(agent?.output, "document")}`,
      detail: `${project.name} · ready for ${meta.label}`,
      to,
    };
  }
  return {
    title: `${AGENT_META[meta.agent!]?.name ?? "The crew"} replied`,
    detail: `${project.name} · waiting for your answer`,
    to,
  };
}

function decisionReceipt(decided: PendingDecision, project: Project | undefined): Omit<Notice, "id"> {
  const gate = STATION_META[decided.station];
  const name = project?.name ?? "The project";
  if (!decided.decision.approved) {
    return {
      title: `${gate.label} sent back`,
      detail: `${name} · back to ${AGENT_META[gate.reviewing!]?.name ?? "the crew"}`,
      to: `/projects/${decided.projectId}`,
    };
  }
  const next = AGENT_META[gate.unlocks!];
  return {
    title: `${gate.label} approved`,
    detail: `${name} · ${next?.name ?? "the next stage"} starts on the ${lower(next?.output, "next document")}`,
    to: `/projects/${decided.projectId}`,
  };
}

/** Pushes a receipt when a run finishes or a decision lands on a project the user has
 * navigated away from. Nothing for the project on screen - the thread already shows it. */
function useReceipts(viewingProjectId: string | undefined) {
  const push = useNotices((s) => s.push);
  const viewing = useRef(viewingProjectId);
  useEffect(() => {
    viewing.current = viewingProjectId;
  }, [viewingProjectId]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const unsubscribe = useProjectsStore.subscribe((state, prev) => {
      const finished = prev.runningProjectId;
      if (finished && state.runningProjectId === null) {
        timers.push(
          setTimeout(() => {
            const now = useProjectsStore.getState();
            if (now.failedRun?.projectId === finished || viewing.current === finished) return;
            const project = now.projects[finished];
            if (project) push(runReceipt(project));
          }, SETTLE_MS),
        );
      }

      const decided = prev.pendingDecision;
      // a landed decision records its signature in the same update that clears the
      // pending one; a failed one clears it alone, and the error toast takes over
      if (
        decided?.committing &&
        state.pendingDecision === null &&
        state.signaturesByProject[decided.projectId] !== prev.signaturesByProject[decided.projectId] &&
        viewing.current !== decided.projectId
      ) {
        push(decisionReceipt(decided, state.projects[decided.projectId]));
      }
    });
    return () => {
      unsubscribe();
      timers.forEach(clearTimeout);
    };
  }, [push]);
}

function NoticeItem({ notice }: { notice: Notice }) {
  const dismiss = useNotices((s) => s.dismiss);
  useEffect(() => {
    const timer = setTimeout(() => dismiss(notice.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [notice.id, dismiss]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } }}
      exit={{ opacity: 0, y: 4, transition: { duration: 0.14, ease: EASE_EXIT } }}
      className="pointer-events-auto flex w-[min(26rem,calc(100vw-2rem))] items-center gap-3 rounded-md border border-line bg-overlay px-3.5 py-2.5 shadow-overlay"
    >
      <CheckCircleIcon weight="fill" className="size-4 shrink-0 text-success" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-fg">{notice.title}</p>
        {notice.detail && <p className="mt-0.5 truncate text-2xs text-fg-muted">{notice.detail}</p>}
      </div>
      {notice.to && (
        <Link
          to={notice.to}
          onClick={() => dismiss(notice.id)}
          className="shrink-0 rounded-sm px-2 py-1 text-2xs font-medium text-accent-text transition-colors hover:bg-accent-bg"
        >
          Open
        </Link>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dismiss(notice.id)}
        className="hit-area shrink-0 rounded-sm p-0.5 text-fg-subtle transition-colors hover:text-fg"
      >
        <XIcon className="size-3.5" />
      </button>
    </motion.li>
  );
}

/** Bottom-center receipts: quiet, self-dismissing, and never for errors. */
export function Notices({ viewingProjectId }: { viewingProjectId: string | undefined }) {
  useReceipts(viewingProjectId);
  const notices = useNotices((s) => s.notices);

  return (
    <ol
      role="status"
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2"
    >
      <AnimatePresence initial={false}>
        {notices.map((notice) => (
          <NoticeItem key={notice.id} notice={notice} />
        ))}
      </AnimatePresence>
    </ol>
  );
}
