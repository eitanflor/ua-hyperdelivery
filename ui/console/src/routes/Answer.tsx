import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowRightIcon, SealCheckIcon } from "@phosphor-icons/react";
import { openQuestions, type OpenQuestion } from "../api/artifacts";
import type { Artifact } from "../api/types";
import { AGENT_META, AGENT_STATIONS } from "../lib/pipeline";
import { questionsFromToolCalls } from "../lib/plan";
import { composeAnswers, mergeAnswers, toggleOption } from "../lib/composeAnswers";
import { useProjectsStore } from "../store/useProjectsStore";
import { AgentFace } from "../components/agents/AgentFace";
import { ErrorToast } from "../components/ErrorToast";
import { QuestionPrompt } from "../components/thread/QuestionPrompt";
import { Button } from "../components/ui/Button";
import { TextArea } from "../components/ui/Field";
import { Spinner } from "../components/ui/Spinner";

const NO_ARTIFACTS: Artifact[] = [];

/** The link "I don't know - ask someone" copies: one project's open questions and nothing
 * else - no thread, no rail, no side panel - for a subject expert who was asked one thing
 * and should not have to learn the console to answer it. */
export function Answer() {
  const { projectId = "" } = useParams();
  const project = useProjectsStore((s) => s.projects[projectId]);
  const artifacts = useProjectsStore((s) => s.artifactsByProject[projectId] ?? NO_ARTIFACTS);
  const conversation = useProjectsStore((s) => s.conversationByProject[projectId]);
  const loadProject = useProjectsStore((s) => s.loadProject);
  const loadArtifacts = useProjectsStore((s) => s.loadArtifacts);
  const advanceProject = useProjectsStore((s) => s.advanceProject);

  const [picked, setPicked] = useState<Map<string, string[]>>(new Map());
  const [typed, setTyped] = useState<Map<string, string>>(new Map());
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<"answering" | "sending" | "done">("answering");

  useEffect(() => {
    void loadProject(projectId);
    void loadArtifacts(projectId);
  }, [projectId, loadProject, loadArtifacts]);

  const agent = project && AGENT_STATIONS.includes(project.station) ? project.station : null;
  const meta = agent ? AGENT_META[agent] : undefined;
  // same sources as the thread, freshest first: this browser's latest turn, then the
  // deployed run's parked question, then the persisted artifact
  const latestTurn = conversation?.filter((t) => t.agent === agent && t.role === "agent").at(-1);
  const fromTurn = questionsFromToolCalls(latestTurn?.toolCalls);
  const questions: OpenQuestion[] = !agent
    ? []
    : fromTurn.length > 0
      ? fromTurn
      : (project?.pending_question?.questions ??
        openQuestions(artifacts.find((a) => a.agent === agent)?.content ?? {}));

  const answers = mergeAnswers(questions, picked, typed);
  const hasAnswer = [...answers.values()].some((a) => a.length > 0) || note.trim().length > 0;

  const send = async () => {
    if (!agent || !hasAnswer) return;
    const message = [composeAnswers(questions, answers), note.trim()].filter(Boolean).join("\n\n");
    setPhase("sending");
    await advanceProject(projectId, agent, message);
    setPhase(useProjectsStore.getState().error ? "answering" : "done");
  };

  const name = meta?.name ?? "The crew";
  const openProject = (
    <Link
      to={`/projects/${projectId}`}
      className="inline-flex items-center gap-1 text-xs font-medium text-accent-text hover:underline"
    >
      Open the project
      <ArrowRightIcon className="size-3" />
    </Link>
  );

  return (
    <div className="min-h-dvh overflow-y-auto bg-canvas text-fg">
      <div className="mx-auto w-full max-w-xl px-6 py-10">
        <Link to="/" className="mb-8 flex w-fit items-center gap-2">
          <img src="/ua-logo.png" alt="" aria-hidden="true" className="size-6 object-contain" />
          <span className="text-xs font-semibold tracking-tight">Hyperdelivery</span>
        </Link>

        {!project ? (
          <div role="status" aria-label="Loading" className="space-y-3">
            <span className="block h-5 w-2/3 animate-pulse rounded-full bg-sunken" />
            <span className="block h-3 w-full animate-pulse rounded-full bg-sunken" />
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3">
              {meta && (
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${meta.bg} ${meta.fg}`}>
                  <AgentFace agent={meta.face} className="size-5.5" />
                </span>
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-tight">{project.name}</h1>
                <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                  {questions.length > 0 && meta
                    ? `${name}, the ${meta.title.toLowerCase()}, needs your help. Your answers go straight into the ${meta.output.toLowerCase()}, so the work starts from what is true rather than a guess.`
                    : `${name} is not waiting on a question for this project right now.`}
                </p>
              </div>
            </div>

            {phase === "done" ? (
              <div className="mt-6 flex animate-rise items-start gap-3 rounded-md border border-success/25 bg-success-bg px-4 py-3">
                <SealCheckIcon weight="fill" className="mt-0.5 size-5 shrink-0 text-success" />
                <div>
                  <p className="text-sm font-medium">Thanks - {name} will use this.</p>
                  <p className="mt-1">{openProject}</p>
                </div>
              </div>
            ) : phase === "sending" ? (
              <p role="status" className="mt-6 flex items-center gap-2 text-sm text-fg-muted">
                <Spinner className="size-4 shrink-0 text-accent-text" />
                {name} is reading your answers.
                {project.orchestration_mode === "local" && " Keep this tab open until it finishes."}
              </p>
            ) : questions.length > 0 ? (
              <div className="mt-6 flex flex-col gap-4">
                <QuestionPrompt
                  key={questions.map((q) => q.id).join()}
                  asker={name}
                  questions={questions}
                  disabled={false}
                  picked={picked}
                  typed={typed}
                  onToggle={(question, option) => setPicked((prev) => toggleOption(prev, question, option))}
                  onType={(question, text) => setTyped((prev) => new Map(prev).set(question.id, text))}
                />
                <TextArea
                  label={`Anything else ${name} should know?`}
                  hint="Optional."
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!hasAnswer}
                  onClick={() => void send()}
                  className="w-full"
                >
                  Send answers to {name}
                </Button>
              </div>
            ) : (
              <p className="mt-6">{openProject}</p>
            )}
          </>
        )}
      </div>
      <ErrorToast />
    </div>
  );
}
