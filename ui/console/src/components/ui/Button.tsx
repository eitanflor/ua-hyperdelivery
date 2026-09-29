import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  // a disabled primary goes neutral rather than fading: half-opacity red reads as pink,
  // which looks like a different, live button
  primary:
    "bg-accent text-fg-on-accent hover:bg-accent-hover shadow-raised disabled:bg-sunken disabled:text-fg-subtle disabled:shadow-none",
  secondary:
    "bg-surface text-fg border border-line hover:border-line-strong hover:bg-sunken disabled:opacity-45",
  ghost: "text-fg-muted hover:bg-sunken hover:text-fg disabled:opacity-45",
  danger:
    "bg-surface text-danger border border-line hover:border-danger hover:bg-danger-bg disabled:opacity-45",
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-2xs gap-1.5",
  md: "h-9 px-4 text-xs gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

/** The only button in the app. Every state (hover, focus, active, disabled, loading)
 * is defined here so no caller has to reinvent half of them. */
export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm font-medium whitespace-nowrap",
        "transition-[background-color,border-color,color] duration-150",
        "active:scale-[0.98] disabled:pointer-events-none",
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner className="size-3.5" /> : icon}
      {children}
    </button>
  );
}
