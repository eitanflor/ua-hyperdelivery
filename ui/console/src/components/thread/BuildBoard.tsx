import { ArrowSquareOutIcon, CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import type { Build } from "../../api/types";
import { Spinner } from "../ui/Spinner";
import { cn } from "../../lib/cn";

/** What a build is doing right now, in one word plus a shape you can read at a glance. */
function Status({ build, reviewComplete }: { build: Build; reviewComplete: boolean }) {
  if (build.state === "merged") {
    return (
      <span className="flex items-center gap-1 text-2xs text-success">
        <CheckCircleIcon weight="fill" className="size-3.5" /> merged
      </span>
    );
  }
  if (build.state === "closed") {
    return <span className="text-2xs text-fg-subtle">closed without merging</span>;
  }
  if (build.checks === "failing") {
    return (
      <span className="flex items-center gap-1 text-2xs text-warning">
        <XCircleIcon weight="fill" className="size-3.5" /> checks failing
      </span>
    );
  }
  if (build.checks === "passing") {
    return (
      <span className="flex items-center gap-1 text-2xs text-success">
        <CheckCircleIcon weight="fill" className="size-3.5" /> checks passing · ready to merge
      </span>
    );
  }
  if (build.state === null) {
    return <span className="text-2xs text-fg-subtle">status unavailable</span>;
  }
  if (build.checks === "none" && !build.draft) {
    // no CI configured and no CI pending look identical over the API, so this says what
    // is true rather than guessing which one it is
    return <span className="text-2xs text-fg-subtle">open · no checks reported</span>;
  }
  if (build.draft && reviewComplete) {
    // Review already assessed this pull request - GitHub's own draft flag just means
    // Copilot never flipped it, not that work is still in progress (see merge.py's
    // mark_ready_for_review, which flips it at merge time regardless).
    return <span className="text-2xs text-fg-muted">in draft · ready for your approval</span>;
  }
  return (
    <span className="flex items-center gap-1 text-2xs text-fg-muted">
      <Spinner className="size-3" />
      {build.draft ? "Copilot is writing the code" : "checks running"}
    </span>
  );
}

/**
 * The work a coding agent is doing, while it is doing it.
 *
 * Sits in the thread rather than the artifact panel because it changes on its own: the
 * point is that a human can open the pull request the moment it exists instead of waiting
 * for the station to finish and tell them about it.
 */
export function BuildBoard({
  repository,
  builds,
  watching,
  reviewComplete = false,
}: {
  repository: string | null;
  builds: Build[];
  watching: boolean;
  //: Review has already handed off (e.g. the console is showing this at the G3 gate) -
  //: a still-draft pull request here is waiting on a human, not on Copilot.
  reviewComplete?: boolean;
}) {
  if (builds.length === 0) return null;

  return (
    <section
      aria-label="Build pull requests"
      className="animate-rise rounded-md border border-line bg-surface px-3.5 py-3"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-2xs font-semibold tracking-wide text-fg-muted uppercase">
          {builds.length === 1 ? "1 pull request building" : `${builds.length} pull requests building`}
        </h2>
        {repository && <span className="font-mono text-2xs text-fg-subtle">{repository}</span>}
      </div>

      <ul className="mt-2.5 flex flex-col gap-1.5">
        {builds.map((build) => (
          <li
            key={build.number}
            className="flex items-center gap-3 rounded-sm border border-line-subtle px-2.5 py-2 transition-colors hover:border-line hover:bg-sunken"
          >
            <span className="min-w-0 flex-1">
              <a
                href={build.url}
                target="_blank"
                rel="noreferrer noopener"
                className="block truncate text-xs text-fg"
              >
                <span className="tabular mr-1.5 font-mono text-2xs text-fg-subtle">
                  #{build.number}
                </span>
                {build.title ?? build.group_id}
              </a>
              <span className="mt-0.5 flex items-center gap-2">
                <Status build={build} reviewComplete={reviewComplete} />
                {build.issue_numbers.length > 0 && (
                  <span className="text-2xs text-fg-subtle">
                    closes{" "}
                    {build.issue_numbers.map((n, i) => (
                      <span key={n}>
                        {i > 0 && ", "}
                        {repository ? (
                          <a
                            href={`https://github.com/${repository}/issues/${n}`}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="font-mono hover:text-fg hover:underline"
                          >
                            #{n}
                          </a>
                        ) : (
                          <span className="font-mono">#{n}</span>
                        )}
                      </span>
                    ))}
                  </span>
                )}
              </span>
            </span>
            <a
              href={build.url}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`Open pull request #${build.number} on GitHub`}
            >
              <ArrowSquareOutIcon className="size-3.5 shrink-0 text-fg-subtle" />
            </a>
          </li>
        ))}
      </ul>

      <p className={cn("mt-2 text-2xs", watching ? "text-fg-subtle" : "text-warning")}>
        {watching
          ? "Updating on its own - Copilot takes a few minutes per pull request, and this " +
            "stage picks the thread back up once they settle. Approving at the gate " +
            "merges every build here automatically."
          : "No GitHub token on the console, so these are links only - open them to see status."}
      </p>
    </section>
  );
}
