import {
  ChatCircleDotsIcon,
  DatabaseIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  PencilSimpleLineIcon,
  WrenchIcon,
  XIcon,
  type Icon,
} from "@phosphor-icons/react";
import { toolKind, type ToolKind } from "../../lib/toolKinds";
import { cn } from "../../lib/cn";

const KIND: Record<ToolKind, Icon> = {
  read: FileTextIcon,
  search: MagnifyingGlassIcon,
  query: DatabaseIcon,
  write: PencilSimpleLineIcon,
  ask: ChatCircleDotsIcon,
  other: WrenchIcon,
};

/** The tool's kind as a bare glyph, so a trace scans by what each step did without adding
 * color to a thread that has almost none. A failed call swaps it for a red cross; a running
 * one pulses. */
export function ToolTile({
  name,
  failed = false,
  running = false,
}: {
  name: string;
  failed?: boolean;
  running?: boolean;
}) {
  const Glyph = failed ? XIcon : KIND[toolKind(name)];
  return (
    <Glyph
      aria-hidden="true"
      weight={failed ? "bold" : "regular"}
      className={cn(
        "size-3 shrink-0",
        failed ? "text-danger" : "text-fg-subtle",
        running && "animate-pulse",
      )}
    />
  );
}
