export function Avatar({
  label,
  tone = "neutral",
  gradient,
}: {
  label: string;
  tone?: "neutral" | "accent";
  gradient?: string;
}) {
  return (
    <div
      className={
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ring-1 ring-black/5 " +
        (gradient
          ? `bg-gradient-to-br ${gradient} text-white`
          : tone === "accent"
            ? "bg-ua-red text-white"
            : "bg-ua-steel text-white")
      }
    >
      {label}
    </div>
  );
}

