import { useState } from "react";
import { useProjectsStore } from "../store/useProjectsStore";
import { Avatar } from "./Avatar";
import { Spinner } from "./Spinner";

const SIGNER_STORAGE_KEY = "hyperdelivery:signer-name";

export function DecisionComposer({ projectId, station }: { projectId: string; station: string }) {
  const [signer, setSigner] = useState(() => localStorage.getItem(SIGNER_STORAGE_KEY) ?? "");
  const [comment, setComment] = useState("");
  const submitDecision = useProjectsStore((s) => s.submitDecision);
  const loading = useProjectsStore((s) => s.loading);

  const decide = (approved: boolean) => {
    const trimmedSigner = signer.trim();
    if (!trimmedSigner) return;
    localStorage.setItem(SIGNER_STORAGE_KEY, trimmedSigner);
    void submitDecision(projectId, { approved, signer: trimmedSigner, comment: comment || null });
  };

  return (
    <div className="animate-fade-in-up flex gap-3">
      <Avatar label="!" tone="accent" />
      <div className="flex-1 rounded-2xl border border-ua-red/30 bg-white px-4 py-3 shadow-md shadow-ua-red/5">
        <p className="font-semibold text-ua-black">
          Decision needed{" "}
          <span className="font-normal text-ua-steel">at {station.replace("_", " ")}</span>
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <input
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ua-black placeholder:text-ua-steel transition-colors focus:border-ua-red focus:outline-none focus:ring-1 focus:ring-ua-red/30"
            placeholder="Your name (signer)"
            value={signer}
            onChange={(e) => setSigner(e.target.value)}
          />
          <textarea
            className="resize-none rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-ua-black placeholder:text-ua-steel transition-colors focus:border-ua-red focus:outline-none focus:ring-1 focus:ring-ua-red/30"
            placeholder="Comment (optional)"
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-ua-red px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-ua-red-dark hover:shadow-md active:scale-[0.98] disabled:opacity-40"
              onClick={() => decide(true)}
              disabled={loading || !signer.trim()}
            >
              {loading && <Spinner />} Approve
            </button>
            <button
              className="flex-1 rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold text-ua-black transition-all hover:border-ua-black/40 hover:bg-black/5 active:scale-[0.98] disabled:opacity-40"
              onClick={() => decide(false)}
              disabled={loading || !signer.trim()}
            >
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
