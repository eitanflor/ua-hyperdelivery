import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { ArrowClockwiseIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import { useProjectsStore } from "../store/useProjectsStore";
import { Button } from "./ui/Button";
import { IconButton } from "./ui/IconButton";

const AUTO_DISMISS_MS = 8000;

/** Global error surface. Errors that offer a recovery stay until they are dealt with -
 * auto-dismissing something the user has to act on just loses it. */
export function ErrorToast() {
  const error = useProjectsStore((s) => s.error);
  const clearError = useProjectsStore((s) => s.clearError);
  const retryFailedRun = useProjectsStore((s) => s.retryFailedRun);
  const failedRun = useProjectsStore((s) => s.failedRun);
  const { instance } = useMsal();

  const dismissible = error?.action === null;

  useEffect(() => {
    if (!error || !dismissible) return;
    const timer = setTimeout(clearError, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [error, dismissible, clearError]);

  if (!error) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed right-4 bottom-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] animate-rise gap-3 rounded-md border border-danger/25 bg-overlay p-3.5 shadow-overlay"
    >
      <WarningIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-danger" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-fg">{error.title}</p>
        <p className="mt-1 text-2xs leading-relaxed text-fg-muted">{error.detail}</p>

        {error.action !== null && (
          <div className="mt-2.5 flex gap-2">
            {error.action === "retry" && failedRun && (
              <Button
                size="sm"
                variant="secondary"
                icon={<ArrowClockwiseIcon className="size-3.5" />}
                onClick={() => {
                  clearError();
                  void retryFailedRun();
                }}
              >
                Try again
              </Button>
            )}
            {error.action === "reload" && (
              <Button size="sm" variant="secondary" onClick={() => window.location.reload()}>
                Reload
              </Button>
            )}
            {error.action === "signin" && (
              <Button size="sm" variant="primary" onClick={() => void instance.loginRedirect()}>
                Sign in
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={clearError}>
              Dismiss
            </Button>
          </div>
        )}
      </div>

      {dismissible && (
        <IconButton
          size="sm"
          label="Dismiss"
          icon={<XIcon className="size-3.5" />}
          onClick={clearError}
        />
      )}
    </div>
  );
}
