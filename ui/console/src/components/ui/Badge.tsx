import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const TONE: Record<Tone, string> = {
  neutral: "bg-sunken text-fg-muted border-line-subtle",
  accent: "bg-accent-bg text-accent-text border-accent-line",
  success: "bg-success-bg text-success border-success/25",
  warning: "bg-warning-bg text-warning border-warning/25",
  danger: "bg-danger-bg text-danger border-danger/25",
  info: "bg-info-bg text-info border-info/25",
};

/** Small status label. Carries its meaning in text, never in color alone. */
export function Badge({
  tone = "neutral",
  icon,
  className,
  children,
}: {
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium whitespace-nowrap",
        TONE[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
