import type { ReactNode } from "react";
import { define } from "../../lib/glossary";
import { Tooltip } from "./Tooltip";

/** A word from the glossary, explained where it is used. Focusable so the definition is
 * reachable without a pointer; renders plain text if the term is not in the glossary. */
export function Term({ term, children }: { term: string; children: ReactNode }) {
  const definition = define(term);
  if (!definition) return <>{children}</>;
  return (
    <Tooltip content={<span className="block max-w-60 leading-relaxed">{definition}</span>}>
      <span
        tabIndex={0}
        className="cursor-help underline decoration-fg-subtle decoration-dotted underline-offset-4"
      >
        {children}
      </span>
    </Tooltip>
  );
}
