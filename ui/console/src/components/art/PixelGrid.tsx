import { useRef } from "react";
import { cn } from "../../lib/cn";
import { useOnScreen } from "./useOnScreen";

/** A small square grid with a wave of lit cells traveling diagonally - the "machine at
 * work" texture from asset brief H, in CSS rather than frames. Paused off screen; reduced
 * motion leaves it still. */
export function PixelGrid({ cells = 4, className }: { cells?: 4 | 6 | 8; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const running = useOnScreen(ref);
  return (
    <span
      ref={ref}
      aria-hidden="true"
      data-paused={running ? undefined : ""}
      className={cn("pixel-grid grid shrink-0 gap-px", className)}
      style={{ gridTemplateColumns: `repeat(${cells}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cells * cells }, (_, i) => (
        <span
          key={i}
          className="aspect-square animate-pixel rounded-[1px] bg-current"
          style={{ animationDelay: `${((i % cells) + Math.floor(i / cells)) * 90}ms` }}
        />
      ))}
    </span>
  );
}
