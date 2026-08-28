import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type Size = "sm" | "md";

const SIZE: Record<Size, string> = {
  sm: "size-7",
  md: "size-9",
};

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Required: an icon-only control is unusable without it. */
  label: string;
  icon: ReactNode;
  size?: Size;
  tone?: "default" | "danger";
}

/** Icon-only control. `label` is mandatory so an unlabeled icon button cannot be built. */
export function IconButton({
  label,
  icon,
  size = "md",
  tone = "default",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm transition-colors duration-150",
        "text-fg-subtle hover:bg-sunken",
        tone === "danger" ? "hover:text-danger" : "hover:text-fg",
        "active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
