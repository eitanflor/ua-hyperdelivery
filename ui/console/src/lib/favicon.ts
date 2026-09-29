import { useEffect } from "react";

const BASE_TITLE = "Hyperdelivery Console";
const SIZE = 64;
// fixed rather than theme tokens: the tab strip belongs to the browser, not the page
const WAITING = "#e4002b";
const WORKING = "#86868f";

let base: Promise<HTMLImageElement> | null = null;
let originalHref: string | null = null;
let generation = 0;

function iconLink(): HTMLLinkElement | null {
  return document.querySelector<HTMLLinkElement>('link[rel="icon"]');
}

function loadBase(href: string): Promise<HTMLImageElement> {
  base ??= new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = href;
  });
  return base;
}

/** The favicon with a status dot, or the plain one for `null`. Stale requests (a newer
 * state arrived while the base image loaded) are dropped rather than painted late. */
function paintIcon(color: string | null): void {
  const link = iconLink();
  if (!link) return;
  originalHref ??= link.href;
  const mine = ++generation;
  if (!color) {
    link.href = originalHref;
    return;
  }
  void loadBase(originalHref)
    .then((img) => {
      if (mine !== generation) return;
      const canvas = document.createElement("canvas");
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      ctx.beginPath();
      ctx.arc(SIZE - 15, SIZE - 15, 13, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      link.href = canvas.toDataURL("image/png");
    })
    .catch(() => undefined);
}

/** Says, from a background tab, whether anything needs you: a count in the title and a
 * red dot on the icon when approvals are waiting, a gray dot while an agent works. */
export function useTabBadge({
  waiting,
  working,
  title,
}: {
  waiting: number;
  working: boolean;
  title?: string;
}): void {
  useEffect(() => {
    document.title = `${waiting > 0 ? `(${waiting}) ` : ""}${title ? `${title} · ` : ""}${BASE_TITLE}`;
  }, [waiting, title]);

  useEffect(() => {
    paintIcon(waiting > 0 ? WAITING : working ? WORKING : null);
  }, [waiting, working]);
}
