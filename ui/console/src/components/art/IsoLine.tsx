import { useId, useRef } from "react";
import { useReducedMotion } from "motion/react";
import type { Station } from "../../api/types";
import { AGENT_META, AGENT_STATIONS, stationIndex } from "../../lib/pipeline";
import { AgentFace, type FaceState } from "../agents/AgentFace";
import { cn } from "../../lib/cn";
import { useOnScreen } from "./useOnScreen";

/** Isometric grid unit in px, and the true 30-degree projection it is drawn in. */
const U = 30;
const C = Math.cos(Math.PI / 6);
const ORIGIN_X = 4 * C * U + 8;
// just enough headroom for the first crew member above the back of the floor
const ORIGIN_Y = 0.7 * U;

function iso(x: number, y: number, z = 0): string {
  // snapped to the 4px grid's half-step, so hairlines land on pixels
  const sx = Math.round((ORIGIN_X + (x - y) * C * U) * 2) / 2;
  const sy = Math.round((ORIGIN_Y + (x + y) * 0.5 * U - z * U) * 2) / 2;
  return `${sx},${sy}`;
}

function point(x: number, y: number, z = 0): { x: number; y: number } {
  const [sx, sy] = iso(x, y, z).split(",").map(Number);
  return { x: sx!, y: sy! };
}

/** A CSS translation `dx` units down the line, which runs along the iso x axis. */
function along(dx: number): string {
  return `translate(${(dx * C * U).toFixed(2)}px,${(dx * 0.5 * U).toFixed(2)}px)`;
}

/** A box's three visible faces - top, and the two that face the viewer. */
function Box({
  x,
  y,
  z = 0,
  dx,
  dy,
  dz,
  top = "fill-surface",
  side = "fill-sunken",
  fill,
}: {
  x: number;
  y: number;
  z?: number;
  dx: number;
  dy: number;
  dz: number;
  top?: string;
  side?: string;
  /** A pattern fill for every face (the hazard stripe). */
  fill?: string;
}) {
  const t = [iso(x, y, z + dz), iso(x + dx, y, z + dz), iso(x + dx, y + dy, z + dz), iso(x, y + dy, z + dz)];
  const left = [iso(x, y + dy, z), iso(x + dx, y + dy, z), iso(x + dx, y + dy, z + dz), iso(x, y + dy, z + dz)];
  const right = [iso(x + dx, y, z), iso(x + dx, y + dy, z), iso(x + dx, y + dy, z + dz), iso(x + dx, y, z + dz)];
  const stroke = "stroke-line-strong";
  // a fill class would beat the pattern's fill attribute, so a patterned box takes none
  const topClass = fill ? undefined : top;
  const sideClass = fill ? undefined : side;
  return (
    <g strokeWidth={1} strokeLinejoin="round">
      <polygon points={left.join(" ")} className={cn(sideClass, stroke)} fill={fill} />
      <polygon points={right.join(" ")} className={cn(sideClass, stroke)} fill={fill} />
      <polygon points={t.join(" ")} className={cn(topClass, stroke)} fill={fill} />
    </g>
  );
}

// literal class names, so the tokens' fill utilities are generated
const HUE_TOP: Record<string, string> = {
  distill: "fill-distill-bg",
  blueprint: "fill-blueprint-bg",
  review: "fill-review-bg",
  showroom: "fill-showroom-bg",
};
const HUE_SIDE: Record<string, string> = {
  distill: "fill-distill",
  blueprint: "fill-blueprint",
  review: "fill-review",
  showroom: "fill-showroom",
};

const GATES: Station[] = ["blueprint_approval", "review_approval", "showroom_approval"];
const PLATFORM_X = [0.4, 4.1, 7.8, 11.5];
const PLATFORM = { dx: 2.2, dy: 1.8, dz: 0.45, y: 0.2 };
const GATE_X = [3.28, 6.98, 10.68];
const BELT = { x: 0, dx: 14.1, y: 2.25, dy: 0.55, dz: 0.2 };
const SHEET = { y: 2.33, dx: 0.65, dy: 0.42, dz: 0.06, rise: 0.08 };
const START_X = 0.15;
const SLAT = 0.78;
const CREW = 40;
const LIFT = 4;

const SPEED = 3;
const FADE = 0.35;
const EASE = "cubic-bezier(0.45, 0, 0.55, 1)";

interface Span {
  arrive: number;
  leave: number;
}

/** The overview's loop, timed from the geometry: one brief rides the belt, stops at each
 * crew member, who adds a sheet in their color, and at each gate, which swings open - then
 * the demo gets its spotlight. The belt's slats travel exactly as far as the brief, and a
 * whole number of slat gaps, so the loop restarts without a jump. */
function buildTour() {
  const sheetAt = (x: number) => x - SHEET.dx / 2;
  const stops: { x: number; hold: number; crew?: number; gate?: number }[] = [{ x: START_X, hold: 0.5 }];
  PLATFORM_X.forEach((px, i) => {
    stops.push({ x: sheetAt(px + PLATFORM.dx / 2), hold: i === PLATFORM_X.length - 1 ? 2 : 1.1, crew: i });
    const gx = GATE_X[i];
    if (gx !== undefined) stops.push({ x: sheetAt(gx + 0.07), hold: 0.8, gate: i });
  });

  const path: [number, number][] = [];
  const crew: Span[] = [];
  const gates: Span[] = [];
  let t = FADE;
  let x = START_X;
  for (const stop of stops) {
    t += Math.abs(stop.x - x) / SPEED;
    x = stop.x;
    const arrive = t;
    t += stop.hold;
    path.push([arrive, x], [t, x]);
    if (stop.crew !== undefined) crew[stop.crew] = { arrive, leave: t };
    if (stop.gate !== undefined) gates[stop.gate] = { arrive, leave: t };
  }
  const total = t + FADE;
  const distance = x - START_X;

  const frames = (name: string, keys: [number, string][]) => {
    const merged = new Map<string, string[]>();
    for (const [s, decl] of keys) {
      const key = `${((Math.min(Math.max(s, 0), total) / total) * 100).toFixed(3)}%`;
      merged.set(key, [...(merged.get(key) ?? []), decl]);
    }
    return `@keyframes ${name}{${[...merged].map(([k, d]) => `${k}{${d.join(";")}}`).join("")}}`;
  };
  const moves: [number, string][] = [
    [0, `transform:${along(0)}`],
    ...path.map(([s, px]): [number, string] => [s, `transform:${along(px - START_X)}`]),
    [total, `transform:${along(distance)}`],
  ];
  const rest = "transform:none";
  const hidden = "opacity:0;transform:translateY(-6px)";
  const shown = "opacity:1;transform:none";
  const last = crew.at(-1)!;

  const css = [
    frames("isoline-belt", moves),
    frames("isoline-packet", [...moves, [0, "opacity:0"], [FADE, "opacity:1"], [total - FADE, "opacity:1"], [total, "opacity:0"]]),
    ...crew.map((w, i) =>
      frames(`isoline-crew-${i}`, [
        [0, rest],
        [w.arrive, rest],
        [w.arrive + 0.25, `transform:translateY(-${LIFT}px)`],
        [w.leave - 0.25, `transform:translateY(-${LIFT}px)`],
        [w.leave, rest],
        [total, rest],
      ]),
    ),
    ...crew.map((w, i) =>
      frames(`isoline-sheet-${i + 1}`, [
        [0, hidden],
        [w.arrive + 0.4, hidden],
        [w.arrive + 0.7, shown],
        [total, shown],
      ]),
    ),
    ...gates.map((w, i) =>
      frames(`isoline-gate-${i}`, [
        [0, rest],
        [w.arrive, rest],
        [w.arrive + 0.35, "transform:rotate(80deg)"],
        [w.leave + 0.2, "transform:rotate(80deg)"],
        [w.leave + 0.55, rest],
        [total, rest],
      ]),
    ),
    frames("isoline-spotlight", [
      [0, "opacity:0"],
      [last.arrive + 0.8, "opacity:0"],
      [last.arrive + 1.2, "opacity:1"],
      [total - FADE, "opacity:1"],
      [total, "opacity:0"],
    ]),
  ].join("");

  return { total, distance, slat: distance / Math.round(distance / SLAT), css };
}

const TOUR = buildTour();
const STATE_CSS =
  "@keyframes isoline-bob{0%,100%{transform:none}50%{transform:translateY(-3px)}}" +
  `@keyframes isoline-run{from{transform:${along(0)}}to{transform:${along(SLAT)}}}` +
  "@keyframes isoline-wait{0%,100%{opacity:1}50%{opacity:0.45}}" +
  ".iso-line[data-paused] *{animation-play-state:paused}";

/** One sheet on the belt: the brief is plain, each later sheet carries the color of the
 * crew member who wrote it. */
function Sheet({ x, s }: { x: number; s: number }) {
  const author = AGENT_STATIONS[s - 1];
  return (
    <Box
      x={x}
      y={SHEET.y}
      z={BELT.dz + s * SHEET.rise}
      dx={SHEET.dx}
      dy={SHEET.dy}
      dz={SHEET.dz}
      top={author ? HUE_TOP[author] : "fill-surface"}
      side={author ? HUE_SIDE[author] : "fill-line"}
    />
  );
}

/** The line as a production floor, drawn in code from the design tokens so it is right in
 * both themes and needs no asset: four platforms with the crew, three hazard-striped gates,
 * and documents stacking up along the belt.
 *
 * `overview` is the explainer: everything in color and a brief touring the whole line on a
 * loop. Without it the drawing reports one project - only finished stages have documents,
 * the one red gate is the one the project waits at (or the first, before there is a
 * project), and only what is really happening moves. Motion pauses off screen and is left
 * out under reduced motion. */
export function IsoLine({
  current,
  active = false,
  overview = false,
  className,
  label,
}: {
  current?: Station;
  /** A run is in progress, so the belt turns and the current crew member works. */
  active?: boolean;
  overview?: boolean;
  className?: string;
  label?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const onScreen = useOnScreen(ref);
  const moving = !useReducedMotion();
  const tour = overview && moving;

  const at = current ? stationIndex(current) : -1;
  const shipped = current === "done";
  const waitingAt = current ? GATES.indexOf(current) : 0;
  const working = !overview && active && current !== undefined && AGENT_STATIONS.includes(current);
  const done = (i: number) => shipped || at > stationIndex(AGENT_STATIONS[i]!);

  const faceState = (i: number): FaceState => {
    if (overview) return "idle";
    if (done(i)) return "done";
    return current === AGENT_STATIONS[i] ? "working" : "idle";
  };
  const loop = (name: string, seconds: number, ease = EASE) =>
    moving ? { animation: `${name} ${seconds}s ${ease} infinite` } : undefined;

  const spacing = tour ? TOUR.slat : SLAT;
  const travel = tour ? TOUR.distance : spacing;
  const slats: number[] = [];
  for (let sx = 0.4 - Math.ceil((travel + 0.4) / spacing) * spacing; sx < BELT.x + BELT.dx; sx += spacing) {
    slats.push(sx);
  }
  const beltTop = [
    iso(BELT.x, BELT.y, BELT.dz),
    iso(BELT.x + BELT.dx, BELT.y, BELT.dz),
    iso(BELT.x + BELT.dx, BELT.y + BELT.dy, BELT.dz),
    iso(BELT.x, BELT.y + BELT.dy, BELT.dz),
  ];

  const width = Math.round(18.6 * C * U + 16);
  const height = Math.round(point(14.4, 3.1, -0.25).y + 8);

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-labelledby={`${id}-title`}
      data-paused={onScreen ? undefined : ""}
      className={cn("iso-line h-auto w-full", className)}
    >
      <title id={`${id}-title`}>
        {label ??
          (overview
            ? "The line: a brief moves past four crew members, each adding a document, and through a gate after each stage where a person approves the work."
            : "The line: four crew stations with a gate between each, documents moving along a belt.")}
      </title>
      {moving && <style>{STATE_CSS + (overview ? TOUR.css : "")}</style>}
      <defs>
        <pattern id={`${id}-hazard`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="3" height="6" className="fill-accent" />
          <rect x="3" width="3" height="6" className="fill-fg" />
        </pattern>
        <pattern id={`${id}-quiet`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="3" height="6" className="fill-fg-subtle" />
          <rect x="3" width="3" height="6" className="fill-surface" />
        </pattern>
        <clipPath id={`${id}-belt`}>
          <polygon points={beltTop.join(" ")} />
        </clipPath>
      </defs>

      {/* the floor */}
      <Box x={-0.3} y={-0.2} z={-0.25} dx={14.7} dy={3.3} dz={0.25} top="fill-canvas" side="fill-sunken" />

      {/* platforms and the gates between them, back to front */}
      {PLATFORM_X.map((px, i) => {
        const agent = AGENT_STATIONS[i]!;
        const lit = overview || current === agent || (shipped && agent === "showroom");
        const gx = GATE_X[i];
        const pivot = gx === undefined ? undefined : point(gx + 0.07, 0.17, 0.73);
        const red = overview || i === waitingAt;
        return (
          <g key={agent}>
            <Box x={px} y={PLATFORM.y} dx={PLATFORM.dx} dy={PLATFORM.dy} dz={PLATFORM.dz} top={lit ? HUE_TOP[agent] : "fill-surface"} />
            {gx !== undefined && pivot && (
              <g>
                <Box x={gx} y={0.1} dx={0.14} dy={0.14} dz={0.8} />
                <g
                  style={
                    tour
                      ? { ...loop(`isoline-gate-${i}`, TOUR.total), transformOrigin: `${pivot.x}px ${pivot.y}px` }
                      : !overview && current && i === waitingAt
                        ? loop("isoline-wait", 1.8, "ease-in-out")
                        : undefined
                  }
                >
                  <Box x={gx} y={0.1} z={0.66} dx={0.14} dy={2.0} dz={0.14} fill={`url(#${id}-${red ? "hazard" : "quiet"})`} />
                </g>
              </g>
            )}
          </g>
        );
      })}

      {/* the belt; its slats travel with the work */}
      <Box x={BELT.x} y={BELT.y} dx={BELT.dx} dy={BELT.dy} dz={BELT.dz} top="fill-sunken" side="fill-canvas" />
      <g clipPath={`url(#${id}-belt)`}>
        <g style={tour ? loop("isoline-belt", TOUR.total) : working ? loop("isoline-run", SLAT / SPEED, "linear") : undefined}>
          {slats.map((sx) => {
            const a = point(sx, BELT.y, BELT.dz);
            const b = point(sx, BELT.y + BELT.dy, BELT.dz);
            return <line key={sx} x1={a.x} y1={a.y} x2={b.x} y2={b.y} className="stroke-line" strokeWidth={1} />;
          })}
        </g>
      </g>

      {/* documents: a finished stage leaves its stack; the overview carries one down the line */}
      {tour ? (
        <g style={loop("isoline-packet", TOUR.total)}>
          <Sheet x={START_X} s={0} />
          {AGENT_STATIONS.map((station, i) => (
            <g key={station} style={loop(`isoline-sheet-${i + 1}`, TOUR.total)}>
              <Sheet x={START_X} s={i + 1} />
            </g>
          ))}
        </g>
      ) : (
        PLATFORM_X.map((px, i) =>
          overview || done(i)
            ? Array.from({ length: i + 2 }, (_, s) => (
                <Sheet key={`${i}-${s}`} x={px + PLATFORM.dx - SHEET.dx / 2} s={s} />
              ))
            : null,
        )
      )}
      {!overview && !current && (
        <g style={loop("isoline-bob", 2.4, "ease-in-out")}>
          <Sheet x={START_X} s={0} />
        </g>
      )}

      {/* the spotlight on the demo */}
      {(shipped || overview) && (
        <g style={tour ? loop("isoline-spotlight", TOUR.total) : undefined}>
          <polygon
            points={[iso(12.6, 1.1, 3.4), iso(11.7, 1.9, PLATFORM.dz), iso(13.5, 0.3, PLATFORM.dz)].join(" ")}
            className="fill-fg"
            opacity={0.06}
          />
        </g>
      )}

      {/* the crew, on top of everything, with headroom to lift while they work */}
      {PLATFORM_X.map((px, i) => {
        const agent = AGENT_STATIONS[i]!;
        const meta = AGENT_META[agent]!;
        const center = point(px + PLATFORM.dx / 2, PLATFORM.y + PLATFORM.dy / 2, PLATFORM.dz);
        const tone =
          overview || current === agent
            ? cn("border-current", meta.bg, meta.fg)
            : done(i)
              ? cn("border-line bg-surface", meta.fg)
              : "border-line bg-surface text-fg-subtle";
        return (
          <foreignObject key={agent} x={center.x - CREW / 2} y={center.y - CREW + 6 - LIFT} width={CREW} height={CREW + LIFT}>
            <div
              className="flex size-full items-end"
              style={
                tour
                  ? loop(`isoline-crew-${i}`, TOUR.total)
                  : working && current === agent
                    ? loop("isoline-bob", 2.4, "ease-in-out")
                    : undefined
              }
            >
              <div className={cn("flex size-10 items-center justify-center rounded-full border", tone)}>
                <AgentFace agent={meta.face} state={faceState(i)} className="size-7" />
              </div>
            </div>
          </foreignObject>
        );
      })}
    </svg>
  );
}
