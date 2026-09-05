import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "./cn";

/**
 * Every element markdown can produce, mapped onto this console's own scale and tokens.
 *
 * Nothing inherits browser defaults: an unstyled `<h1>` renders at 2rem inside a chat
 * bubble and an unstyled `<table>` ignores the palette entirely. Headings are a heavier
 * line rather than a step up in size, because a station's reply is one message, not a
 * document with an outline - the station bands are the page's real headings.
 */
const COMPONENTS: Components = {
  p: ({ children }) => <p className="mt-2 first:mt-0">{children}</p>,
  h1: ({ children }) => <p className="mt-3 font-semibold text-fg first:mt-0">{children}</p>,
  h2: ({ children }) => <p className="mt-3 font-semibold text-fg first:mt-0">{children}</p>,
  h3: ({ children }) => <p className="mt-3 font-semibold text-fg first:mt-0">{children}</p>,
  h4: ({ children }) => <p className="mt-3 font-semibold text-fg first:mt-0">{children}</p>,
  h5: ({ children }) => <p className="mt-3 font-semibold text-fg first:mt-0">{children}</p>,
  h6: ({ children }) => <p className="mt-3 font-semibold text-fg first:mt-0">{children}</p>,
  ul: ({ children }) => <ul className="mt-2 list-disc space-y-0.5 pl-4 first:mt-0">{children}</ul>,
  ol: ({ children }) => (
    <ol className="mt-2 list-decimal space-y-0.5 pl-4 first:mt-0">{children}</ol>
  ),
  strong: ({ children }) => <strong className="font-semibold text-fg">{children}</strong>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      // the text is model-generated, so never hand the opener a window reference
      rel="noopener noreferrer"
      className="text-accent-text underline underline-offset-2 hover:no-underline"
    >
      {children}
    </a>
  ),
  code: InlineOrBlockCode,
  pre: ({ children }) => (
    <pre className="mt-2 overflow-x-auto rounded-sm bg-sunken p-2 first:mt-0">{children}</pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-2 border-l border-line pl-3 text-fg-muted first:mt-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-3 border-line-subtle" />,
  table: ({ children }) => (
    <div className="mt-2 overflow-x-auto first:mt-0">
      <table className="w-full border-collapse text-2xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-line px-2 py-1 text-left font-semibold text-fg">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-line-subtle px-2 py-1 align-top">{children}</td>
  ),
  // a station has no business rendering remote images into the thread
  img: () => null,
};

/** An inline span keeps its chip; one inside a `<pre>` must not draw a second box. */
function InlineOrBlockCode({ className, children }: ComponentProps<"code">): ReactNode {
  const isBlock = typeof className === "string" && className.startsWith("language-");
  return (
    <code className={cn("font-mono text-2xs", !isBlock && "rounded-sm bg-sunken px-1 py-0.5")}>
      {children}
    </code>
  );
}

/**
 * Agent replies and reasoning, rendered as markdown.
 *
 * Also used mid-stream, where the buffer is a half-written document: unclosed emphasis
 * stays literal, since remark will not pair it either, but an unclosed code fence does
 * render as a code block until its closer arrives. That reflow is the accepted cost of
 * having one renderer - a simpler second one for streaming would make every finished turn
 * visibly re-lay-out the moment the run ends.
 */
export function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
      {text}
    </ReactMarkdown>
  );
}
