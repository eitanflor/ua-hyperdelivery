import { useState } from "react";
import { useProjectsStore } from "../store/useProjectsStore";

export function NewProjectComposer({ onCreated }: { onCreated: (projectId: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const createProject = useProjectsStore((s) => s.createProject);
  const loading = useProjectsStore((s) => s.loading);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const project = await createProject(name.trim());
    setName("");
    setOpen(false);
    onCreated(project.id);
  };

  if (!open) {
    return (
      <button
        className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-ua-cloud transition-all hover:border-ua-red/50 hover:bg-ua-red/5 hover:text-ua-red active:scale-[0.98]"
        onClick={() => setOpen(true)}
      >
        <span className="text-ua-red">+</span> New project
      </button>
    );
  }

  return (
    <div className="animate-scale-in flex flex-col gap-2 rounded-lg border border-white/10 bg-ua-black/40 p-2">
      <input
        autoFocus
        className="rounded-md bg-ua-black px-2 py-1.5 text-sm text-ua-cloud placeholder:text-ua-steel focus:outline-none focus:ring-1 focus:ring-ua-red/30"
        placeholder="Project name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void handleCreate();
          if (e.key === "Escape") setOpen(false);
        }}
      />
      <div className="flex gap-2">
        <button
          className="flex-1 rounded-md bg-ua-red py-1 text-xs font-semibold text-white transition-all hover:bg-ua-red-dark active:scale-[0.98] disabled:opacity-40"
          onClick={handleCreate}
          disabled={loading || !name.trim()}
        >
          Create
        </button>
        <button
          className="flex-1 rounded-md border border-white/10 py-1 text-xs text-ua-fog transition-colors hover:text-ua-cloud"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
