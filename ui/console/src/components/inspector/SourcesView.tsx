import { useEffect, useState } from "react";
import {
  ChatCircleTextIcon,
  FileDocIcon,
  FileIcon,
  FilePdfIcon,
  FilePptIcon,
  FileTextIcon,
  FileXlsIcon,
  ImageIcon,
  QuotesIcon,
} from "@phosphor-icons/react";
import { api } from "../../api/client";
import type { Artifact, StoredDocument } from "../../api/types";
import { list, type EvidenceLink, type EvidenceSource } from "../../api/artifacts";
import { callSources } from "../../lib/narration";
import { EVIDENCE_LABEL } from "../../lib/plainLabels";
import { timeAgo } from "../../lib/time";
import { useProjectsStore, type ChatTurn } from "../../store/useProjectsStore";
import { Artwork } from "../art/Artwork";

const NO_TURNS: ChatTurn[] = [];

function fileIcon(name: string) {
  const ext = name.split(".").at(-1)?.toLowerCase() ?? "";
  const className = "size-4 shrink-0 text-fg-muted";
  if (ext === "pdf") return <FilePdfIcon className={className} />;
  if (ext === "doc" || ext === "docx") return <FileDocIcon className={className} />;
  if (ext === "ppt" || ext === "pptx") return <FilePptIcon className={className} />;
  if (ext === "xls" || ext === "xlsx" || ext === "csv") return <FileXlsIcon className={className} />;
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return <ImageIcon className={className} />;
  if (["md", "txt"].includes(ext)) return <FileTextIcon className={className} />;
  return <FileIcon className={className} />;
}

function size(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Truncate a file name in the middle, so the extension - the part that says what it is -
 * survives (detail.design `typography-3`). */
function middle(name: string, max = 40): string {
  if (name.length <= max) return name;
  const keep = max - 1;
  return `${name.slice(0, Math.ceil(keep / 2))}…${name.slice(-Math.floor(keep / 2))}`;
}

const EVIDENCE_ICON: Record<EvidenceSource, React.ReactNode> = {
  source_document: <FileTextIcon className="size-3.5 shrink-0" />,
  stakeholder_answer: <ChatCircleTextIcon className="size-3.5 shrink-0" />,
  reference_material: <QuotesIcon className="size-3.5 shrink-0" />,
};

/** Everything the crew was given or found - the answer to "what did Scout actually read?". */
export function SourcesView({ projectId, artifacts }: { projectId: string; artifacts: Artifact[] }) {
  const [documents, setDocuments] = useState<StoredDocument[] | null>(null);
  const conversation = useProjectsStore((s) => s.conversationByProject[projectId] ?? NO_TURNS);

  useEffect(() => {
    let live = true;
    api.listDocuments(projectId).then(
      (result) => live && setDocuments(result),
      () => live && setDocuments([]),
    );
    return () => {
      live = false;
    };
  }, [projectId]);

  const read = callSources(conversation.flatMap((turn) => turn.toolCalls ?? []));
  const evidence = list<EvidenceLink>(artifacts.find((a) => a.agent === "distill")?.content ?? {}, "evidence");
  const bySource = (["source_document", "stakeholder_answer", "reference_material"] as const)
    .map((source) => ({ source, count: evidence.filter((e) => (e.source ?? "source_document") === source).length }))
    .filter((entry) => entry.count > 0);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <section aria-labelledby="sources-uploaded">
        <h3 id="sources-uploaded" className="text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
          Uploaded
        </h3>
        {documents === null ? (
          <div role="status" aria-label="Loading documents" className="mt-2.5 space-y-2">
            {[0, 1].map((i) => (
              <span key={i} className="block h-10 animate-pulse rounded-sm bg-sunken" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="mt-2">
            <Artwork id="d4-tray" className="mb-2 block h-16 w-auto" />
            <p className="text-xs leading-relaxed text-fg-muted">
              {bySource.some((entry) => entry.source === "source_document")
                ? "No files attached - the requirements cite the brief itself, as it was written at the start. Attach a document in the message box to give the crew more to read."
                : "Nothing uploaded yet. Attach a document in the message box to give the crew more to read."}
            </p>
          </div>
        ) : (
          <ul className="mt-2.5 flex flex-col gap-1.5">
            {documents.map((doc) => (
              <li
                key={doc.key}
                className="flex items-center gap-2.5 rounded-sm border border-line-subtle bg-surface px-3 py-2"
              >
                {fileIcon(doc.filename)}
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-fg" title={doc.filename}>
                    {middle(doc.filename)}
                  </span>
                  <span className="tabular block text-2xs text-fg-subtle">
                    {size(doc.size)}
                    {doc.uploaded_at && ` · ${timeAgo(doc.uploaded_at)}`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {read.length > 0 && (
        <section aria-labelledby="sources-read" className="mt-5">
          <h3 id="sources-read" className="text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
            Read by the crew
          </h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {read.map((name) => (
              <li
                key={name}
                title={name}
                className="flex max-w-full items-center gap-1 rounded-full border border-line-subtle bg-surface px-2 py-0.5 text-2xs text-fg-muted"
              >
                {fileIcon(name)}
                <span className="truncate">{middle(name, 32)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {bySource.length > 0 && (
        <section aria-labelledby="sources-cited" className="mt-5">
          <h3 id="sources-cited" className="text-2xs font-semibold tracking-wide text-fg-subtle uppercase">
            What the requirements cite
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {bySource.map(({ source, count }) => (
              <li key={source} className="flex items-center gap-2 text-xs text-fg-muted">
                {EVIDENCE_ICON[source]}
                <span className="flex-1">{EVIDENCE_LABEL[source]}</span>
                <span className="tabular text-fg">{count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
