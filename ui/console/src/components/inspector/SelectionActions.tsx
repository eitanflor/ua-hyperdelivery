import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChatCircleTextIcon, CheckIcon, LightbulbIcon, LinkSimpleIcon } from "@phosphor-icons/react";

interface Anchor {
  text: string;
  top: number;
  left: number;
}

const MIN_CHARS = 3;

/** Highlight a passage in a document and act on it without retyping it (Beautiful UI
 * Selection Actions). Asking goes through the composer, not straight to an agent: the
 * reader sees the quote, can edit it, and sends it like any other message. */
export function SelectionActions({
  children,
  askAs,
  onQuote,
  documentTitle,
}: {
  children: ReactNode;
  /** Whoever holds the project now; asking is offered only while someone can answer. */
  askAs?: string;
  onQuote?: (quote: string, lead: string) => void;
  documentTitle: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const read = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? "";
      const node = selection?.anchorNode;
      if (!selection || selection.isCollapsed || text.length < MIN_CHARS || !node || !ref.current?.contains(node)) {
        setAnchor(null);
        return;
      }
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      setAnchor({ text, top: rect.top, left: rect.left + rect.width / 2 });
      setCopied(false);
    };
    const dismiss = () => setAnchor(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("mouseup", read);
    document.addEventListener("keyup", read);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      document.removeEventListener("mouseup", read);
      document.removeEventListener("keyup", read);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, []);

  const quote = (lead: string) => {
    if (!anchor || !onQuote) return;
    onQuote(anchor.text, lead);
    window.getSelection()?.removeAllRanges();
    setAnchor(null);
  };

  const copy = () => {
    if (!anchor) return;
    const text = `"${anchor.text}"\n- ${documentTitle}: ${window.location.href}`;
    void navigator.clipboard.writeText(text).then(
      () => setCopied(true),
      () => undefined,
    );
  };

  const button =
    "flex h-7 items-center gap-1.5 rounded-full px-2.5 text-2xs font-medium text-canvas/85 transition-colors hover:bg-canvas/15 hover:text-canvas";

  return (
    <div ref={ref}>
      {children}
      {anchor && (
        <div
          role="toolbar"
          aria-label="Selected text"
          // keeps the selection alive: a mousedown on a button would otherwise clear it first
          onMouseDown={(e) => e.preventDefault()}
          style={{ top: Math.max(8, anchor.top - 44), left: anchor.left }}
          className="fixed z-40 flex -translate-x-1/2 animate-pop items-center gap-0.5 rounded-full bg-fg p-1 shadow-overlay"
        >
          {askAs && onQuote && (
            <>
              <button type="button" className={button} onClick={() => quote("Explain this in plain language:")}>
                <LightbulbIcon className="size-3.5" />
                Explain
              </button>
              <button type="button" className={button} onClick={() => quote(`Question about this:`)}>
                <ChatCircleTextIcon className="size-3.5" />
                Ask {askAs}
              </button>
            </>
          )}
          <button type="button" className={button} onClick={copy}>
            {copied ? <CheckIcon weight="bold" className="size-3.5" /> : <LinkSimpleIcon className="size-3.5" />}
            {copied ? "Copied" : "Copy with link"}
          </button>
        </div>
      )}
    </div>
  );
}
