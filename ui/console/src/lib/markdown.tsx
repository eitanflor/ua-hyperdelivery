import type { ReactNode } from "react";
import { cn } from "./cn";

/** Inline **bold** and `code` - the only markdown agents actually produce mid-sentence. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const pattern = /\*\*(.+?)\*\*|`(.+?)`/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      match[1] !== undefined ? (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-fg">
          {match[1]}
        </strong>
      ) : (
        <code
          key={`${keyPrefix}-${i}`}
          className="rounded-sm bg-sunken px-1 py-0.5 font-mono text-2xs"
        >
          {match[2]}
        </code>
      ),
    );
    last = pattern.lastIndex;
    i += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

/** Minimal markdown for agent replies: bold, inline code, "- " bullet lists, and blank-line
 * paragraph breaks - enough for the structured summaries agents produce, without a markdown
 * library. Renders best-effort mid-stream too, so a still-typing "**foo" is just literal
 * text until the closing "**" arrives. */
export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n");
        const items = lines.filter((line) => line.trim().length > 0);
        const isList = items.length > 0 && items.every((line) => line.trim().startsWith("- "));

        if (isList) {
          return (
            <ul key={blockIndex} className={cn("list-disc space-y-0.5 pl-4", blockIndex > 0 && "mt-2")}>
              {items.map((line, itemIndex) => (
                <li key={itemIndex}>
                  {renderInline(line.trim().slice(2), `${blockIndex}-${itemIndex}`)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={blockIndex} className={blockIndex > 0 ? "mt-2" : undefined}>
            {lines.map((line, lineIndex) => (
              <span key={lineIndex}>
                {lineIndex > 0 && <br />}
                {renderInline(line, `${blockIndex}-${lineIndex}`)}
              </span>
            ))}
          </p>
        );
      })}
    </>
  );
}
