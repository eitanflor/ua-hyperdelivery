/* Prepares a Variant B screen for Figma's HTML import. Inert unless the URL carries ?figma.
   The importer drops two things these screens rely on, so this rewrites both in place:
   - inset box-shadow rings and hairlines become real borders (padding absorbs the width);
   - every SVG shape becomes one absolute path (M, L, C, Z only) with its paint written on it,
     because inherited fill/stroke and relative, H/V and arc commands do not survive the import. */
(() => {
  if (!/[?&]figma\b/.test(location.search)) return;
  const SVG_NS = "http://www.w3.org/2000/svg";
  const f = (n) => String(Math.round(n * 1000) / 1000);

  // ---------- Rings and hairlines to borders ----------
  const splitTop = (s) => s.split(/,(?![^(]*\))/).map((x) => x.trim());
  const parseShadow = (raw) => {
    const color = (raw.match(/rgba?\([^)]*\)/) || [null])[0];
    const nums = raw.replace(/rgba?\([^)]*\)/, "").replace("inset", "").trim().split(/\s+/).map(parseFloat);
    const [x = 0, y = 0, blur = 0, spread = 0] = nums;
    return { raw, color, x, y, blur, spread, inset: /\binset\b/.test(raw) };
  };
  const SIDES = ["Top", "Right", "Bottom", "Left"];
  // Returns how much of the new border the padding could not absorb.
  const addBorder = (el, cs, side, width, color) => {
    if (parseFloat(cs["border" + side + "Width"]) > 0) return null;
    el.style["border" + side] = `${width}px solid ${color}`;
    const pad = parseFloat(cs["padding" + side]);
    if (pad >= width) { el.style["padding" + side] = `${pad - width}px`; return 0; }
    return width;
  };
  // Leftover border would push the content inward. Per axis, negative margins let an auto-sized
  // or stretched box grow outward instead, so its content and its neighbors stay put. A fixed
  // size also has to be raised, but only for a one-sided hairline (a divider on a fixed-height
  // row): a full ring on a fixed control stays inside it, keeping the control's size and center.
  const AXES = [["Left", "Right", "left", "width"], ["Top", "Bottom", "top", "height"]];
  const holdContent = (el, before, extra) => {
    const cs = getComputedStyle(el);
    for (const [a, b, pos, size] of AXES) {
      const grow = extra[a] + extra[b];
      if (!grow) continue;
      const saved = [el.style["margin" + a], el.style["margin" + b], el.style[size]];
      const restore = () => { [el.style["margin" + a], el.style["margin" + b], el.style[size]] = saved; };
      const pull = () => { for (const s of [a, b]) if (extra[s]) el.style["margin" + s] = `${parseFloat(cs["margin" + s]) - extra[s]}px`; };
      const fits = () => {
        const r = el.getBoundingClientRect();
        return Math.abs(r[pos] - (before[pos] - extra[a])) < 0.5 && Math.abs(r[size] - (before[size] + grow)) < 0.5;
      };
      pull();
      if (fits()) continue;
      restore();
      if (extra[a] === extra[b]) continue;
      pull();
      el.style[size] = `${before[size] + grow}px`;
      if (!fits()) restore();
    }
  };
  const rings = () => {
    for (const el of document.querySelectorAll("body *")) {
      if (el.closest("svg")) continue;
      const cs = getComputedStyle(el);
      if (cs.boxShadow === "none") continue;
      const before = el.getBoundingClientRect();
      const extra = { Top: 0, Right: 0, Bottom: 0, Left: 0 };
      const keep = [];
      for (const p of splitTop(cs.boxShadow).map(parseShadow)) {
        if (!p.inset || p.blur !== 0 || !p.color) { keep.push(p.raw); continue; }
        if (p.x === 0 && p.y === 0 && p.spread > 0) {
          for (const side of SIDES) extra[side] += addBorder(el, cs, side, p.spread, p.color) ?? 0;
        } else if (p.spread === 0 && (p.x === 0) !== (p.y === 0)) {
          const side = p.y > 0 ? "Top" : p.y < 0 ? "Bottom" : p.x > 0 ? "Left" : "Right";
          const left = addBorder(el, cs, side, Math.abs(p.x || p.y), p.color);
          if (left === null) keep.push(p.raw); else extra[side] += left;
        } else keep.push(p.raw);
      }
      el.style.boxShadow = keep.length ? keep.join(", ") : "none";
      holdContent(el, before, extra);
    }
  };

  // ---------- SVG shapes to absolute paths ----------
  const arcToCubics = (x1, y1, rx, ry, phiDeg, large, sweep, x2, y2) => {
    if (!rx || !ry || (x1 === x2 && y1 === y2)) return [[x1, y1, x2, y2, x2, y2]];
    rx = Math.abs(rx); ry = Math.abs(ry);
    const phi = (phiDeg * Math.PI) / 180, cos = Math.cos(phi), sin = Math.sin(phi);
    const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
    const xp = cos * dx + sin * dy, yp = -sin * dx + cos * dy;
    const lam = (xp * xp) / (rx * rx) + (yp * yp) / (ry * ry);
    if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }
    const num = rx * rx * ry * ry - rx * rx * yp * yp - ry * ry * xp * xp;
    const den = rx * rx * yp * yp + ry * ry * xp * xp;
    const scale = (large === sweep ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
    const cxp = (scale * rx * yp) / ry, cyp = (-scale * ry * xp) / rx;
    const cx = cos * cxp - sin * cyp + (x1 + x2) / 2, cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
    const angle = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    const t1 = angle(1, 0, (xp - cxp) / rx, (yp - cyp) / ry);
    let dt = angle((xp - cxp) / rx, (yp - cyp) / ry, (-xp - cxp) / rx, (-yp - cyp) / ry);
    if (!sweep && dt > 0) dt -= 2 * Math.PI;
    else if (sweep && dt < 0) dt += 2 * Math.PI;
    const n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9));
    const seg = dt / n, k = (4 / 3) * Math.tan(seg / 4);
    const at = (ex, ey) => [cos * rx * ex - sin * ry * ey + cx, sin * rx * ex + cos * ry * ey + cy];
    const out = [];
    for (let i = 0, t = t1; i < n; i++, t += seg) {
      const c1 = Math.cos(t), s1 = Math.sin(t), c2 = Math.cos(t + seg), s2 = Math.sin(t + seg);
      out.push([...at(c1 - k * s1, s1 + k * c1), ...at(c2 + k * s2, s2 - k * c2), ...at(c2, s2)]);
    }
    out[n - 1][4] = x2; out[n - 1][5] = y2;
    return out;
  };

  const normalize = (d) => {
    let i = 0;
    const skip = () => { while (i < d.length && /[\s,]/.test(d[i])) i++; };
    const number = () => {
      skip();
      const m = /^[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/.exec(d.slice(i));
      if (!m) throw new Error(`bad path near ${d.slice(i, i + 12)}`);
      i += m[0].length;
      return parseFloat(m[0]);
    };
    const flag = () => { skip(); return d[i++] === "1"; };
    const out = [];
    let cmd = "", x = 0, y = 0, sx = 0, sy = 0, lc = null, lq = null;
    while (true) {
      skip();
      if (i >= d.length) break;
      if (/[a-zA-Z]/.test(d[i])) cmd = d[i++];
      const rel = cmd !== cmd.toUpperCase(), C = cmd.toUpperCase();
      const ox = rel ? x : 0, oy = rel ? y : 0;
      if (C === "Z") { out.push("Z"); x = sx; y = sy; lc = lq = null; cmd = ""; continue; }
      if (!cmd) break;
      if (C === "M") { x = sx = number() + ox; y = sy = number() + oy; out.push(`M${f(x)} ${f(y)}`); cmd = rel ? "l" : "L"; lc = lq = null; }
      else if (C === "L") { x = number() + ox; y = number() + oy; out.push(`L${f(x)} ${f(y)}`); lc = lq = null; }
      else if (C === "H") { x = number() + ox; out.push(`L${f(x)} ${f(y)}`); lc = lq = null; }
      else if (C === "V") { y = number() + oy; out.push(`L${f(x)} ${f(y)}`); lc = lq = null; }
      else if (C === "C" || C === "S") {
        let x1, y1;
        if (C === "C") { x1 = number() + ox; y1 = number() + oy; }
        else { x1 = lc ? 2 * x - lc[0] : x; y1 = lc ? 2 * y - lc[1] : y; }
        const x2 = number() + ox, y2 = number() + oy, ex = number() + ox, ey = number() + oy;
        out.push(`C${f(x1)} ${f(y1)} ${f(x2)} ${f(y2)} ${f(ex)} ${f(ey)}`);
        lc = [x2, y2]; lq = null; x = ex; y = ey;
      } else if (C === "Q" || C === "T") {
        let qx, qy;
        if (C === "Q") { qx = number() + ox; qy = number() + oy; }
        else { qx = lq ? 2 * x - lq[0] : x; qy = lq ? 2 * y - lq[1] : y; }
        const ex = number() + ox, ey = number() + oy;
        out.push(`C${f(x + (2 / 3) * (qx - x))} ${f(y + (2 / 3) * (qy - y))} ${f(ex + (2 / 3) * (qx - ex))} ${f(ey + (2 / 3) * (qy - ey))} ${f(ex)} ${f(ey)}`);
        lq = [qx, qy]; lc = null; x = ex; y = ey;
      } else if (C === "A") {
        const rx = number(), ry = number(), rot = number(), large = flag(), sweep = flag();
        const ex = number() + ox, ey = number() + oy;
        for (const c of arcToCubics(x, y, rx, ry, rot, large, sweep, ex, ey)) out.push(`C${c.map(f).join(" ")}`);
        lc = lq = null; x = ex; y = ey;
      } else throw new Error(`unsupported path command ${cmd}`);
    }
    return out.join("");
  };

  const num = (el, name, fallback = 0) => {
    const v = el.getAttribute(name);
    return v === null || v === "auto" ? fallback : parseFloat(v);
  };
  const shapeToPath = (el) => {
    switch (el.tagName.toLowerCase()) {
      case "path": return el.getAttribute("d") || "";
      case "line": return `M${num(el, "x1")} ${num(el, "y1")}L${num(el, "x2")} ${num(el, "y2")}`;
      case "polyline":
      case "polygon": {
        const p = (el.getAttribute("points") || "").trim().split(/[\s,]+/).map(parseFloat);
        let d = `M${p[0]} ${p[1]}`;
        for (let k = 2; k + 1 < p.length; k += 2) d += `L${p[k]} ${p[k + 1]}`;
        return el.tagName.toLowerCase() === "polygon" ? d + "Z" : d;
      }
      case "circle":
      case "ellipse": {
        const cx = num(el, "cx"), cy = num(el, "cy");
        const rx = el.tagName.toLowerCase() === "circle" ? num(el, "r") : num(el, "rx");
        const ry = el.tagName.toLowerCase() === "circle" ? rx : num(el, "ry");
        return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
      }
      case "rect": {
        const x = num(el, "x"), y = num(el, "y"), w = num(el, "width"), h = num(el, "height");
        let rx = num(el, "rx", NaN), ry = num(el, "ry", NaN);
        if (Number.isNaN(rx)) rx = Number.isNaN(ry) ? 0 : ry;
        if (Number.isNaN(ry)) ry = rx;
        rx = Math.min(rx, w / 2); ry = Math.min(ry, h / 2);
        if (!rx || !ry) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
        return `M${x + rx} ${y}H${x + w - rx}A${rx} ${ry} 0 0 1 ${x + w} ${y + ry}V${y + h - ry}A${rx} ${ry} 0 0 1 ${x + w - rx} ${y + h}` +
          `H${x + rx}A${rx} ${ry} 0 0 1 ${x} ${y + h - ry}V${y + ry}A${rx} ${ry} 0 0 1 ${x + rx} ${y}Z`;
      }
      default: return null;
    }
  };
  const PAINT = ["fill", "fill-opacity", "fill-rule", "stroke", "stroke-width", "stroke-opacity", "stroke-linecap", "stroke-linejoin", "stroke-miterlimit", "stroke-dasharray", "opacity"];
  const paths = () => {
    for (const shape of document.querySelectorAll("svg :is(path, line, polyline, polygon, circle, ellipse, rect)")) {
      if (shape.closest("defs, clipPath, mask, pattern, symbol")) continue;
      const d = shapeToPath(shape);
      if (!d) continue;
      const cs = getComputedStyle(shape);
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", normalize(d));
      for (const prop of PAINT) {
        const v = cs.getPropertyValue(prop);
        if (v && v !== "normal") p.setAttribute(prop, prop === "stroke-width" ? String(parseFloat(v)) : v);
      }
      if (shape.getAttribute("transform")) p.setAttribute("transform", shape.getAttribute("transform"));
      shape.replaceWith(p);
    }
  };

  const run = () => {
    rings();
    paths();
    document.documentElement.dataset.figmaReady = "1";
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run);
})();
