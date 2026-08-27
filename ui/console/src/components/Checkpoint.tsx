export function Checkpoint({ label }: { label: string }) {
  return (
    <div className="animate-fade-in flex items-center gap-3 pl-11 text-xs text-ua-steel">
      <span className="h-px flex-1 bg-black/10" />
      <span className="flex items-center gap-1.5">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500/15 text-[9px] text-emerald-600">
          ✓
        </span>
        {label}
      </span>
      <span className="h-px flex-1 bg-black/10" />
    </div>
  );
}
