import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "../../lib/cn";
import { useOnScreen } from "./useOnScreen";

const OPEN = [
  "   _|_   ",
  " .-----. ",
  " | o o | ",
  " |  =  | ",
  " '-----' ",
];

function frame(eyes: string, mouth = "  =  "): string[] {
  return [OPEN[0]!, OPEN[1]!, ` |${eyes}| `, ` |${mouth}| `, OPEN[4]!];
}

/** A crew head drawn in printable ASCII, glancing around and blinking (asset brief H). */
const FRAMES: string[][] = [
  frame(" o o "),
  frame(" o o "),
  frame(" o o "),
  frame("  o o"),
  frame("  o o"),
  frame(" o o "),
  frame(" - - "),
  frame(" o o "),
  frame("o o  "),
  frame("o o  "),
  frame(" o o ", "  -  "),
  frame(" o o "),
];

/** A tiny animated ASCII crew head for places that deserve a little warmth - the not-found
 * page, empty moments. Stops on its first frame off screen and under reduced motion. */
export function AsciiBot({ className }: { className?: string }) {
  const ref = useRef<HTMLPreElement>(null);
  const running = useOnScreen(ref);
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!running || reduced) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % FRAMES.length), 260);
    return () => clearInterval(id);
  }, [running, reduced]);

  return (
    <pre
      ref={ref}
      aria-hidden="true"
      className={cn("font-mono text-xs leading-tight select-none", className)}
    >
      {(FRAMES[reduced ? 0 : index] ?? FRAMES[0]!).join("\n")}
    </pre>
  );
}
