import { useEffect } from "react";
import { useProjectsStore } from "../store/useProjectsStore";

const AUTO_DISMISS_MS = 6000;

/** Global error surface - the store's `error` field is set by any guarded action
 * (delete, create, decide, advance...), but several of those actions happen in places
 * with no inline error display of their own (Sidebar delete, LandingComposer create),
 * so a failure there previously just silently stopped loading with no feedback. */
export function ErrorToast() {
  const error = useProjectsStore((s) => s.error);
  const clearError = useProjectsStore((s) => s.clearError);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(clearError, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [error, clearError]);

  if (!error) return null;

  return (
    <div className="animate-fade-in-up fixed right-4 bottom-4 z-50 flex max-w-sm items-start gap-2 rounded-xl border border-ua-red/20 bg-white px-4 py-3 text-sm text-ua-black shadow-lg">
      <span className="mt-0.5 shrink-0 text-ua-red">⚠</span>
      <p className="flex-1">{error}</p>
      <button
        className="shrink-0 text-ua-steel transition-colors hover:text-ua-black"
        onClick={clearError}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
