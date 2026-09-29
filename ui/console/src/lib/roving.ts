import type { KeyboardEvent } from "react";

const STEP: Record<string, 1 | -1> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** Arrow/Home/End movement for a radiogroup or tablist: focus moves and `onPick` selects,
 * which is what the ARIA patterns for both promise. Attach to the group's `onKeyDown`;
 * `selector` matches the items, and each item should carry `tabIndex={selected ? 0 : -1}`. */
export function rovingKeyDown(
  e: KeyboardEvent<HTMLElement>,
  selector: string,
  onPick: (item: HTMLElement) => void,
): void {
  const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(selector));
  const current = items.indexOf(document.activeElement as HTMLElement);
  if (current === -1) return;

  let next: number;
  if (e.key === "Home") next = 0;
  else if (e.key === "End") next = items.length - 1;
  else if (e.key in STEP) next = (current + STEP[e.key]! + items.length) % items.length;
  else return;

  e.preventDefault();
  items[next]?.focus();
  if (items[next]) onPick(items[next]);
}
