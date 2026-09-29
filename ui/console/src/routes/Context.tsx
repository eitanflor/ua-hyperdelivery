import { useEffect, useState } from "react";
import { useContextStore } from "../store/useContextStore";
import { personName } from "../lib/people";
import { Button } from "../components/ui/Button";
import { TextArea } from "../components/ui/Field";
import { Spinner } from "../components/ui/Spinner";

/** Only mounts once the store has a value to seed local edit state from - mirrors how
 * the old per-project form waited for `project` to exist before rendering. */
function ContextForm({
  context,
  updatedBy,
  updatedAt,
}: {
  context: string;
  updatedBy: string | null;
  updatedAt: string | null;
}) {
  const save = useContextStore((s) => s.save);
  const [value, setValue] = useState(context);
  const [saving, setSaving] = useState(false);
  const dirty = value !== context;

  const onSave = async () => {
    setSaving(true);
    try {
      await save(value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TextArea
        label="Context"
        rows={16}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. Repo: github.com/org/repo. Database: Postgres on RDS. Design system: ..."
      />

      <div className="mt-3 flex items-center justify-between">
        <p className="text-2xs text-fg-subtle" title={updatedBy ?? undefined}>
          {updatedBy
            ? `Last updated by ${personName(updatedBy)}${
                updatedAt ? ` on ${new Date(updatedAt).toLocaleString()}` : ""
              }`
            : "No context recorded yet."}
        </p>
        <Button variant="primary" size="sm" onClick={() => void onSave()} loading={saving} disabled={!dirty}>
          Save
        </Button>
      </div>
    </>
  );
}

export function Context() {
  const context = useContextStore((s) => s.context);
  const updatedBy = useContextStore((s) => s.updatedBy);
  const updatedAt = useContextStore((s) => s.updatedAt);
  const loaded = useContextStore((s) => !s.loading);
  const error = useContextStore((s) => s.error);
  const clearError = useContextStore((s) => s.clearError);
  const load = useContextStore((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-2xl px-6 py-8">
        <h1 className="stencil text-2xl tracking-tight text-fg">Workspace notes</h1>
        <p className="mt-1 text-sm text-fg-muted">
          The repositories, databases, design system or conventions every crew member should
          already know, so nobody retypes them into a chat. Shared by every project.
        </p>

        <div className="mt-6">
          {error && (
            <div role="alert" className="mb-3 rounded-md border border-danger/25 bg-overlay p-3">
              <p className="text-xs font-semibold text-fg">{error.title}</p>
              <p className="mt-1 text-2xs text-fg-muted">{error.detail}</p>
              <Button size="sm" variant="ghost" className="mt-2" onClick={clearError}>
                Dismiss
              </Button>
            </div>
          )}
          {loaded ? (
            <ContextForm context={context} updatedBy={updatedBy} updatedAt={updatedAt} />
          ) : (
            <Spinner className="size-4" />
          )}
        </div>
      </div>
    </div>
  );
}
