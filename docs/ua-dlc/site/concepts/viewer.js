/*
 * HyperDelivery concept canvas viewer.
 *
 * Reads project/canvas.json and lays every board out as a frame on a pan-and-zoom canvas. Each frame
 * holds the board itself in an iframe at its native size, so the canvas transform does the scaling.
 * Iframes load only when a frame is in view at a readable zoom, and far-off ones are unloaded so a
 * long session stays light. Boards are inert until focused (double-click or Enter), which keeps
 * dragging and scrolling on the canvas instead of inside a board. A link from one board to another
 * moves the viewer to that board rather than loading it inside the first board's frame.
 *
 * No framework and no build step: serve the site folder over HTTP (make site).
 */
(() => {
  "use strict";

  const CANVAS_URL = "project/canvas.json";
  const BOARD_DIR = "project/";
  const LIVE_MIN_ZOOM = 0.15; // below this a board is too small to read, so it stays a placeholder
  const MAX_LIVE = 8; // live iframes kept beyond the visible ones before far-off ones unload
  const MAX_LOADING = 3; // concurrent iframe loads
  const Z_MAX = 4;
  const Z_FLOOR = 0.01;
  const IDLE_MS = 160; // a gesture is over after this long without input
  const FIT_PAD = 56; // screen px around fitted content
  const LABEL_H = 28; // screen px of a frame title strip, kept clear when fitting
  const LABELS_MIN_ZOOM = 0.12; // below this the title strips would collide with the row above
  const NOTE_BASE = 72; // title1 notes: one bold 72 px line that shrinks to maxW
  const CAPTION_SCALE = 0.6; // a title1 note that heads no boards (the disclaimer) reads as a caption
  const NOTE_MIN_SCREEN = 13; // row titles never render smaller than this on screen
  const STEP = 1.25;
  const PHASE_RE = /^(Final MVP|MVP|Enterprise|Current State|Today)\b\s*(.*)$/;
  const START_BOARDS = 3; // the first view frames this many boards of the first row, at a live zoom
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (id) => document.getElementById(id);
  const app = $("app");
  const viewport = $("viewport");
  const world = $("world");
  const list = $("boardList");
  const zoomLabel = $("zoomLabel");
  const fitBoardBtn = $("fitBoard");
  const focusBar = $("focusBar");
  const statusBox = $("status");
  const shortcuts = $("shortcuts");

  const view = { x: 0, y: 0, z: 1 }; // screen = world * z + (x, y), in viewport-local px
  let size = { w: viewport.clientWidth, h: viewport.clientHeight };
  let boards = [];
  let notes = [];
  let rowsDesc = [];
  const byId = new Map();
  let selected = null;
  let focused = null;
  let anim = 0;
  let idleTimer = 0;
  let drag = null;
  let pinch = null;
  let gestureZ = 0;
  let spaceDown = false;
  let loading = 0;
  let lastClick = { board: null, t: 0 };
  let sideBeforeFocus = null; // whether the board list was open before a board was focused
  const pointers = new Map();

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // ---------- data ----------

  // "Name · Sub · Phase (note)": the phase becomes the tag and any note after it joins the sub line.
  function parseTitle(title, file) {
    const parts = (title || file.replace(/\.dc\.html?$/i, "")).split(" · ");
    let phase = "";
    let phaseFull = "";
    const m = parts.length > 1 ? PHASE_RE.exec(parts[parts.length - 1]) : null;
    if (m) {
      phaseFull = parts.pop();
      phase = m[1];
      const rest = m[2].replace(/^\((.*)\)$/, "$1").trim();
      if (rest) parts.push(rest.charAt(0).toUpperCase() + rest.slice(1));
    }
    return { name: parts[0], sub: parts.slice(1).join(" · "), phase, phaseFull };
  }

  // A shorter name for the placeholder at far zoom: the part before ": ", unless another board
  // shares it (then the part after, so the two still differ).
  function shortNames(list) {
    const head = (n) => (n.includes(": ") ? n.slice(0, n.indexOf(": ")) : n);
    const count = new Map();
    for (const b of list) count.set(head(b.name), (count.get(head(b.name)) || 0) + 1);
    for (const b of list) {
      const h = head(b.name);
      const tail = b.name.slice(h.length + 2);
      const short = count.get(h) > 1 && tail ? tail.charAt(0).toUpperCase() + tail.slice(1) : h;
      // a camel-case name may break at its hump, and the longest piece sets the far-zoom font size
      b.short = short.replace(/([a-z])([A-Z])/g, "$1\u200b$2");
      b.shortChars = Math.max(...b.short.split(/[\s\u200b]+/).map((w) => w.length));
    }
  }

  function boardForHref(href, base) {
    let u;
    try {
      u = new URL(href, base);
    } catch {
      return null;
    }
    if (u.origin !== location.origin) return null;
    const seg = u.pathname.slice(u.pathname.lastIndexOf("/") + 1);
    if (!/\.dc\.html?$/i.test(seg)) return null;
    let file = seg;
    try {
      file = decodeURIComponent(seg);
    } catch {
      // keep the raw segment
    }
    return byId.get(boardIdFor(file)) || null;
  }

  function boardIdFor(file) {
    return file.replace(/\.dc\.html?$/i, "");
  }

  function load() {
    fetch(CANVAS_URL, { cache: "no-cache" })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(build)
      .catch((err) => {
        const local = location.protocol === "file:";
        statusBox.hidden = false;
        statusBox.innerHTML = local
          ? "The canvas reads its boards over HTTP, so it does not open from a file. Run <code>make site</code> in the repository and open <code>http://localhost:8766/concepts/</code>."
          : `Could not load <code>${CANVAS_URL}</code> (${String(err.message || err)}).`;
      });
  }

  function build(data) {
    const order = Array.isArray(data.order) ? data.order : [];
    const entries = Object.entries(data.boards || {});
    const rank = new Map(order.map((f, i) => [f, i]));
    entries.sort((a, b) => {
      const ra = rank.has(a[0]) ? rank.get(a[0]) : 1e6;
      const rb = rank.has(b[0]) ? rank.get(b[0]) : 1e6;
      return ra - rb || a[1].y - b[1].y || a[1].x - b[1].x;
    });

    notes = Object.entries(data.notes || {})
      .map(([id, n]) => ({ id, ...n }))
      .filter((n) => typeof n.text === "string" && Number.isFinite(n.x) && Number.isFinite(n.y))
      .sort((a, b) => a.y - b.y || a.x - b.x);
    const rowNotes = notes.filter((n) => n.kind === "title1");

    boards = entries.map(([file, b], index) => {
      const t = parseTitle(b.title, file);
      const row = rowNotes.filter((n) => n.y <= b.y).pop() || null;
      return {
        id: boardIdFor(file), file, index, x: b.x, y: b.y, w: b.w, h: b.h,
        title: b.title || boardIdFor(file), ...t, row,
        el: null, body: null, iframe: null, state: "idle", visible: false, item: null,
      };
    });
    boards.forEach((b) => byId.set(b.id, b));
    shortNames(boards);
    rowNotes.forEach((n) => {
      n.boards = boards.filter((b) => b.row === n);
      n.groupTop = n.boards.length ? Math.min(...n.boards.map((b) => b.y)) : Infinity;
      n.prevBottom = Math.max(-Infinity, ...boards.filter((b) => b.y < n.y).map((b) => b.y + b.h));
    });
    rowsDesc = [...rowNotes].sort((a, b) => b.y - a.y);

    renderNotes();
    renderFrames();
    renderList(rowNotes);
    if (data.title) document.title = data.title;

    const restore = () => {
      if (!applyHash(false)) startView(false);
    };
    restore();
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {
      measureNotes();
      layoutNotes();
    });
  }

  // ---------- rendering ----------

  function renderNotes() {
    const frag = document.createDocumentFragment();
    for (const n of notes) {
      const el = document.createElement("div");
      n.caption = n.kind === "title1" && Array.isArray(n.boards) && !n.boards.length;
      n.size0 = n.caption ? NOTE_BASE * CAPTION_SCALE : NOTE_BASE;
      el.className = n.kind !== "title1" ? "note sticky" : n.caption ? "note caption" : "note";
      el.textContent = n.text;
      el.style.left = `${n.x}px`;
      el.style.top = `${n.y}px`;
      if (n.kind === "title1") {
        el.style.fontSize = `${n.size0}px`;
      } else {
        el.style.width = `${n.w || 320}px`;
      }
      n.el = el;
      n.base = n.size0;
      n.shift = 0;
      frag.appendChild(el);
    }
    world.appendChild(frag);
    measureNotes();
  }

  function measureNotes() {
    for (const n of notes) {
      if (n.kind !== "title1") continue;
      n.el.style.fontSize = `${n.size0}px`;
      const width = n.el.scrollWidth;
      let s = 1;
      if (n.maxW && width > n.maxW) s = n.maxW / width;
      if (n.maxH && n.size0 * 1.15 > n.maxH) s = Math.min(s, n.maxH / (n.size0 * 1.15));
      n.base = n.size0 * s;
      n.el.style.fontSize = `${n.base}px`;
      n.fs = n.base;
    }
  }

  // Row titles keep a readable minimum size on screen when zoomed far out. Each one sits in the gap
  // between the row above and its own frames (and their title strips), shrinking to fit that gap;
  // below LABELS_MIN_ZOOM the title strips hide so the row titles get the room.
  function noteLayout(z) {
    const out = new Map();
    const labelSpace = (z >= LABELS_MIN_ZOOM ? LABEL_H + 6 : 2) / z;
    const pad = 2 / z;
    let nextTop = Infinity;
    for (const n of rowsDesc) {
      const want = Math.max(n.base, NOTE_MIN_SCREEN / z);
      const bottom = Math.min(nextTop - pad, n.groupTop - labelSpace);
      const room = bottom - (n.prevBottom + pad);
      const fs = Math.max(n.base, Math.min(want, room / 1.15));
      const top = Math.min(n.y, bottom - fs * 1.15);
      out.set(n, { fs, shift: n.y - top });
      nextTop = top;
    }
    return out;
  }

  function layoutNotes() {
    for (const [n, l] of noteLayout(view.z)) {
      if (l.fs !== n.fs) {
        n.el.style.fontSize = `${l.fs}px`;
        n.fs = l.fs;
      }
      if (l.shift !== n.shift) {
        n.el.style.transform = l.shift ? `translateY(${-l.shift}px)` : "";
        n.shift = l.shift;
      }
    }
  }

  function phaseTag(b) {
    const span = document.createElement("span");
    span.className = b.phase === "Enterprise" ? "tag enterprise" : "tag";
    span.textContent = b.phase;
    if (b.phaseFull !== b.phase) span.title = b.phaseFull;
    return span;
  }

  function renderFrames() {
    const frag = document.createDocumentFragment();
    for (const b of boards) {
      const el = document.createElement("div");
      el.className = "frame";
      el.dataset.id = b.id;
      el.style.cssText = `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;--w:${b.w};--sw:${b.shortChars}`;

      const label = document.createElement("div");
      label.className = "label";
      const t = document.createElement("span");
      t.className = "t";
      const strong = document.createElement("b");
      strong.textContent = b.name;
      t.appendChild(strong);
      if (b.sub) t.appendChild(document.createTextNode(` · ${b.sub}`));
      t.title = b.title;
      label.appendChild(t);
      if (b.phase) label.appendChild(phaseTag(b));
      const open = document.createElement("a");
      open.className = "open";
      open.href = BOARD_DIR + encodeURI(b.file);
      open.target = "_blank";
      open.rel = "noopener";
      open.tabIndex = -1; // keyboard users open boards from the bar shown while using one
      open.title = "Open the board full page in a new tab";
      open.setAttribute("aria-label", `Open ${b.name} in a new tab`);
      open.innerHTML =
        'Open <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5h5v5M9.5 2.5 3 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      label.appendChild(open);

      const body = document.createElement("div");
      body.className = "frame-body";
      const ph = document.createElement("div");
      ph.className = "ph";
      const phTitle = document.createElement("div");
      phTitle.className = "ph-title";
      phTitle.textContent = b.name;
      const phShort = document.createElement("div");
      phShort.className = "ph-short";
      phShort.textContent = b.short;
      const phState = document.createElement("div");
      phState.className = "ph-state";
      phState.textContent = "Loading";
      ph.append(phTitle, phShort, phState);
      body.appendChild(ph);

      el.append(label, body);
      b.el = el;
      b.body = body;
      frag.appendChild(el);
    }
    world.appendChild(frag);
  }

  function renderList(rowNotes) {
    list.textContent = "";
    $("boardCount").textContent = String(boards.length);
    const groups = [];
    const loose = boards.filter((b) => !b.row);
    if (loose.length) groups.push({ title: "", items: loose });
    for (const n of rowNotes) if (n.boards.length) groups.push({ title: n.text, items: n.boards });
    for (const g of groups) {
      const section = document.createElement("section");
      section.className = "side-group";
      if (g.title) {
        const h = document.createElement("h2");
        h.textContent = g.title.replace(/^\d+\s+/, "");
        section.appendChild(h);
      }
      for (const b of g.items) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "item";
        btn.dataset.id = b.id;
        const row = document.createElement("span");
        row.className = "row";
        const name = document.createElement("span");
        name.className = "name";
        name.textContent = b.name;
        row.appendChild(name);
        if (b.phase) row.appendChild(phaseTag(b));
        btn.appendChild(row);
        if (b.sub) {
          const sub = document.createElement("span");
          sub.className = "sub";
          sub.textContent = b.sub;
          btn.appendChild(sub);
        }
        btn.title = b.title;
        btn.addEventListener("click", () => {
          if (focused) focusBoard(b);
          else {
            select(b);
            flyTo(fitView(b));
          }
        });
        btn.addEventListener("dblclick", () => focusBoard(b));
        btn.addEventListener("keydown", (e) => {
          if (e.key !== "Enter" || e.altKey || e.ctrlKey || e.metaKey) return;
          e.preventDefault();
          focusBoard(b);
        });
        b.item = btn;
        section.appendChild(btn);
      }
      list.appendChild(section);
    }
    const foot = notes.filter((n) => n.kind === "title1" && !n.boards.length).map((n) => n.text);
    $("sideFoot").textContent = foot.join(" ");
  }

  // ---------- view ----------

  function zMin() {
    const r = contentBounds(0);
    if (!r) return Z_FLOOR;
    return Math.max(Z_FLOOR, Math.min(size.w / r.w, size.h / r.h) * 0.5);
  }

  function apply() {
    world.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.z})`;
    world.style.setProperty("--z", String(view.z));
    world.style.setProperty("--inv", String(1 / view.z));
    zoomLabel.textContent = `${Math.round(view.z * 100)}%`;
    app.classList.toggle("z-low", view.z < LIVE_MIN_ZOOM);
    app.classList.toggle("labels-off", view.z < LABELS_MIN_ZOOM);
    layoutNotes();
    markMoving();
  }

  function markMoving() {
    app.classList.add("moving");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(onIdle, IDLE_MS);
  }

  function onIdle() {
    if (anim || (drag && drag.moved) || pinch || gestureZ) {
      idleTimer = setTimeout(onIdle, IDLE_MS);
      return;
    }
    app.classList.remove("moving");
    updateLive();
  }

  function setView(v) {
    view.x = v.x;
    view.y = v.y;
    view.z = v.z;
    apply();
  }

  function zoomAt(sx, sy, nz) {
    nz = clamp(nz, zMin(), Z_MAX);
    const wx = (sx - view.x) / view.z;
    const wy = (sy - view.y) / view.z;
    setView({ z: nz, x: sx - wx * nz, y: sy - wy * nz });
  }

  function zoomStep(dir) {
    stopAnim();
    const target = view.z * (dir > 0 ? STEP : 1 / STEP);
    const nz = clamp(target, zMin(), Z_MAX);
    const cx = size.w / 2;
    const cy = size.h / 2;
    const wx = (cx - view.x) / view.z;
    const wy = (cy - view.y) / view.z;
    flyTo({ z: nz, x: cx - wx * nz, y: cy - wy * nz }, true, 180);
  }

  function zoomTo100() {
    const b = selected;
    const cx = size.w / 2;
    const cy = size.h / 2;
    let wx = (cx - view.x) / view.z;
    let wy = (cy - view.y) / view.z;
    if (b && !intersects(b, worldRect(0))) {
      wx = b.x + b.w / 2;
      wy = b.y + Math.min(b.h, size.h) / 2;
    }
    flyTo({ z: 1, x: cx - wx, y: cy - wy }, true, 220);
  }

  let baseBounds = null;

  // The boards and notes as one rectangle; with a zoom, notes count where they sit at that zoom.
  function contentBounds(z) {
    if (!boards.length) return null;
    if (!baseBounds) {
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const b of boards) {
        x0 = Math.min(x0, b.x);
        y0 = Math.min(y0, b.y);
        x1 = Math.max(x1, b.x + b.w);
        y1 = Math.max(y1, b.y + b.h);
      }
      for (const n of notes) {
        x0 = Math.min(x0, n.x);
        y0 = Math.min(y0, n.y);
      }
      baseBounds = { x0, y0, x1, y1 };
    }
    let { y0 } = baseBounds;
    if (z) for (const [n, l] of noteLayout(z)) y0 = Math.min(y0, n.y - l.shift);
    const { x0, x1, y1 } = baseBounds;
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  function fitRect(r, pad, maxZ) {
    const z = clamp(Math.min((size.w - 2 * pad) / r.w, (size.h - 2 * pad - LABEL_H) / r.h), Z_FLOOR, maxZ);
    return {
      z,
      x: (size.w - r.w * z) / 2 - r.x * z,
      y: (size.h - r.h * z + LABEL_H) / 2 - r.y * z,
    };
  }

  function fitAll(animate = true) {
    let r = contentBounds(0);
    if (!r) return;
    let v = fitRect(r, FIT_PAD, 1);
    // row titles grow and slide up when small, so refit with them where they will sit
    for (let i = 0; i < 2; i += 1) {
      r = contentBounds(v.z);
      v = fitRect(r, FIT_PAD, 1);
    }
    flyTo(v, animate);
  }

  // The first view without a hash: the first row's opening boards with their row title, close
  // enough that they load live. Fit All (Shift+1) still shows everything.
  function startView(animate = true) {
    const row = notes.find((n) => n.kind === "title1" && n.boards && n.boards.length);
    const first = row ? row.boards.slice(0, START_BOARDS) : boards.slice(0, START_BOARDS);
    if (!first.length) return;
    const x0 = Math.min(...first.map((b) => b.x));
    const x1 = Math.max(...first.map((b) => b.x + b.w));
    const y1 = Math.max(...first.map((b) => b.y + b.h));
    const top = (z) => {
      let y = first[0].y;
      for (const [n, l] of noteLayout(z)) if (n.y < first[0].y) y = Math.min(y, n.y - l.shift);
      return y;
    };
    let z = fitRect({ x: x0, y: top(1), w: x1 - x0, h: y1 - top(1) }, FIT_PAD, 1).z;
    z = Math.max(LIVE_MIN_ZOOM, fitRect({ x: x0, y: top(z), w: x1 - x0, h: y1 - top(z) }, FIT_PAD, 1).z);
    // top-aligned, so a short screen shows the boards' tops rather than their middles
    flyTo({ z, x: (size.w - (x1 - x0) * z) / 2 - x0 * z, y: FIT_PAD - top(z) * z }, animate);
  }

  function fitView(b) {
    return fitRect(b, FIT_PAD, 1);
  }

  // Focus frames a board for use: the whole board when it fits at a readable size, otherwise full
  // width from the top so a tall board reads like a page and scrolls with the wheel.
  function focusView(b) {
    const pad = 32;
    const zW = Math.min((size.w - 2 * pad) / b.w, 1);
    const zFit = Math.min(zW, (size.h - 2 * pad - LABEL_H) / b.h);
    if (zFit >= zW * 0.75) return fitRect(b, pad, 1);
    return { z: zW, x: (size.w - b.w * zW) / 2 - b.x * zW, y: pad + LABEL_H - b.y * zW };
  }

  function stopAnim() {
    if (anim) cancelAnimationFrame(anim);
    anim = 0;
  }

  function flyTo(target, animate = true, ms = 420) {
    stopAnim();
    if (!animate || reduceMotion) {
      setView(target);
      return;
    }
    const z0 = view.z;
    const z1 = target.z;
    const c0 = { x: (size.w / 2 - view.x) / z0, y: (size.h / 2 - view.y) / z0 };
    const c1 = { x: (size.w / 2 - target.x) / z1, y: (size.h / 2 - target.y) / z1 };
    const t0 = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / ms);
      const e = ease(t);
      const z = Math.exp(Math.log(z0) + (Math.log(z1) - Math.log(z0)) * e);
      const cx = c0.x + (c1.x - c0.x) * e;
      const cy = c0.y + (c1.y - c0.y) * e;
      view.z = z;
      view.x = size.w / 2 - cx * z;
      view.y = size.h / 2 - cy * z;
      if (t >= 1) {
        anim = 0;
        setView(target);
        return;
      }
      apply();
      anim = requestAnimationFrame(tick);
    };
    anim = requestAnimationFrame(tick);
  }

  // ---------- selection and focus ----------

  function select(b) {
    if (selected === b) return;
    if (selected) {
      selected.el.classList.remove("sel");
      if (selected.item) selected.item.removeAttribute("aria-current");
    }
    selected = b;
    if (b) {
      b.el.classList.add("sel");
      if (b.item) {
        b.item.setAttribute("aria-current", "true");
        b.item.scrollIntoView({ block: "nearest" });
      }
    } else if (focused) {
      unfocus();
    }
    fitBoardBtn.disabled = !b;
  }

  function setInteractive(b, on) {
    b.el.classList.toggle("focused", on);
    if (b.iframe) {
      b.iframe.inert = !on;
      b.iframe.tabIndex = on ? 0 : -1;
    }
  }

  function focusBoard(b, animate = true) {
    if (focused && focused !== b) setInteractive(focused, false);
    if (!focused) {
      // a board in use gets the full width; the list comes back when the board is left
      sideBeforeFocus = !app.classList.contains("side-hidden");
      if (sideBeforeFocus) showSidebar(false);
    }
    select(b);
    focused = b;
    setInteractive(b, true);
    ensureLive(b, true);
    flyTo(focusView(b), animate);
    $("focusTitle").textContent = b.title;
    $("focusOpen").href = BOARD_DIR + encodeURI(b.file);
    focusBar.hidden = false;
    writeHash();
  }

  function unfocus() {
    if (!focused) return;
    const b = focused;
    focused = null;
    setInteractive(b, false);
    try {
      const se = b.iframe && b.iframe.contentDocument && b.iframe.contentDocument.scrollingElement;
      if (se) se.scrollTop = 0; // back on the canvas the frame shows the board from its top
    } catch {
      // cross-origin boards keep their own scroll
    }
    focusBar.hidden = true;
    if (sideBeforeFocus) {
      showSidebar(true);
      if (b.item) b.item.scrollIntoView({ block: "nearest" });
    }
    sideBeforeFocus = null;
    writeHash();
    viewport.focus({ preventScroll: true });
  }

  function step(dir) {
    if (!boards.length) return;
    const i = selected ? selected.index : dir > 0 ? -1 : 0;
    const next = boards[(i + dir + boards.length) % boards.length];
    if (focused) focusBoard(next);
    else {
      select(next);
      flyTo(fitView(next));
    }
    return next;
  }

  function writeHash() {
    const h = focused ? `#${encodeURIComponent(focused.id)}` : "";
    if (location.hash !== h) history.replaceState(null, "", location.pathname + location.search + h);
  }

  function applyHash(animate) {
    const id = decodeURIComponent(location.hash.slice(1));
    const b = byId.get(id);
    if (b) {
      focusBoard(b, animate);
      return true;
    }
    if (!id && focused) unfocus();
    return false;
  }

  // ---------- lazy iframes ----------

  function worldRect(marginFrac) {
    const mx = (size.w * marginFrac) / view.z;
    const my = (size.h * marginFrac) / view.z;
    return {
      x0: -view.x / view.z - mx,
      y0: -view.y / view.z - my,
      x1: (size.w - view.x) / view.z + mx,
      y1: (size.h - view.y) / view.z + my,
    };
  }

  function intersects(b, r) {
    return b.x < r.x1 && b.x + b.w > r.x0 && b.y < r.y1 && b.y + b.h > r.y0;
  }

  function distanceToCenter(b) {
    const cx = (size.w / 2 - view.x) / view.z;
    const cy = (size.h / 2 - view.y) / view.z;
    const dx = Math.max(b.x - cx, 0, cx - (b.x + b.w));
    const dy = Math.max(b.y - cy, 0, cy - (b.y + b.h));
    return Math.hypot(dx, dy);
  }

  function updateLive() {
    if (!boards.length) return;
    const r = worldRect(0.1);
    const readable = view.z >= LIVE_MIN_ZOOM;
    for (const b of boards) b.visible = intersects(b, r);
    const want = boards
      .filter((b) => !b.iframe && (b === focused || (readable && b.visible)))
      .sort((a, b) => distanceToCenter(a) - distanceToCenter(b));
    for (const b of want) {
      if (b !== focused && loading >= MAX_LOADING) break;
      ensureLive(b);
    }
    const live = boards.filter((b) => b.iframe);
    if (live.length > MAX_LIVE) {
      const spare = live
        .filter((b) => b !== focused && !b.visible)
        .sort((a, b) => distanceToCenter(b) - distanceToCenter(a));
      let count = live.length;
      while (count > MAX_LIVE && spare.length) {
        unload(spare.shift());
        count -= 1;
      }
    }
  }

  function ensureLive(b, now = false) {
    if (b.iframe) return;
    if (!now && loading >= MAX_LOADING) return;
    const f = document.createElement("iframe");
    f.src = BOARD_DIR + encodeURI(b.file);
    f.title = b.title;
    f.width = String(b.w);
    f.height = String(b.h);
    f.style.width = `${b.w}px`;
    f.style.height = `${b.h}px`;
    f.inert = b !== focused;
    f.tabIndex = b === focused ? 0 : -1;
    b.iframe = f;
    b.state = "loading";
    b.el.classList.add("loading");
    loading += 1;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      loading = Math.max(0, loading - 1);
      if (b.iframe !== f) return;
      wireBoard(b, f);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (b.iframe !== f) return;
          b.state = "live";
          b.el.classList.remove("loading");
          b.el.classList.add("live");
        }),
      );
      if (!app.classList.contains("moving")) updateLive();
    };
    // Every later load means the frame navigated (a link with no board handler, or a reload).
    f.addEventListener("load", () => {
      if (b.iframe !== f) return;
      if (!done) finish();
      else frameNavigated(b, f);
    });
    setTimeout(finish, 15000);
    b.body.appendChild(f);
  }

  // A frame always shows its own board. If it navigated to another board anyway, put it back and
  // move the viewer to the board it went to; a reload of the same board is wired again.
  function frameNavigated(b, f) {
    let href = "";
    try {
      href = f.contentWindow.location.href;
    } catch {
      return; // cross-origin: nothing to wire or compare
    }
    const own = new URL(BOARD_DIR + encodeURI(b.file), location.href);
    const now = new URL(href);
    if (now.pathname === own.pathname || href === "about:blank") {
      wireBoard(b, f);
      return;
    }
    const t = boardForHref(href, location.href);
    f.src = own.href;
    if (t && t !== b) focusBoard(t);
  }

  function unload(b) {
    if (!b.iframe) return;
    b.iframe.remove();
    b.iframe = null;
    b.state = "idle";
    b.el.classList.remove("loading", "live");
  }

  // Boards are same-origin when served over HTTP, so a focused board can hand canvas gestures,
  // Escape and links to other boards back to the viewer. Listeners sit on the board's document,
  // which is new on every load. Cross-origin (file://) boards simply keep their own events.
  function wireBoard(b, f) {
    let win;
    let doc;
    try {
      win = f.contentWindow;
      doc = win && win.document;
      if (!doc) return;
    } catch {
      return;
    }
    if (doc.hdWired) return;
    doc.hdWired = true;
    const toViewport = (e) => ({
      sx: view.x + (b.x + e.clientX) * view.z,
      sy: view.y + (b.y + e.clientY) * view.z,
    });
    // Bubble phase, after the board's own handlers: a link the board already handled is left alone.
    doc.addEventListener("click", (e) => {
      if (focused !== b || e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a || a.hasAttribute("download") || (a.target && a.target.toLowerCase() !== "_self")) return;
      const t = boardForHref(a.getAttribute("href"), win.location.href);
      if (!t || t === b) return; // in-board anchors and external links behave as links
      e.preventDefault();
      focusBoard(t);
    });
    doc.addEventListener(
      "wheel",
      (e) => {
        if (focused !== b) return;
        const zoom = e.ctrlKey || e.metaKey;
        if (!zoom && canScroll(e.target, e.deltaX, e.deltaY, win)) return;
        e.preventDefault();
        stopAnim();
        const p = toViewport(e);
        handleWheel(e.deltaX, e.deltaY, e.deltaMode, zoom, e.shiftKey, p.sx, p.sy);
      },
      { passive: false },
    );
    doc.addEventListener("gesturestart", (e) => {
      if (focused !== b) return;
      e.preventDefault();
      gestureZ = view.z;
    });
    doc.addEventListener("gesturechange", (e) => {
      if (focused !== b || !gestureZ) return;
      e.preventDefault();
      const p = toViewport(e);
      zoomAt(p.sx, p.sy, gestureZ * e.scale);
    });
    doc.addEventListener("gestureend", () => {
      gestureZ = 0;
    });
    doc.addEventListener("keydown", (e) => {
      if (focused !== b) return;
      if (e.key === "Escape" && !e.defaultPrevented) {
        e.preventDefault();
        unfocus();
        return;
      }
      if (e.key === " " && !e.repeat && isPlainTarget(e.target)) {
        e.preventDefault();
        setSpace(true);
      }
    });
    doc.addEventListener("keyup", (e) => {
      if (e.key === " ") setSpace(false);
    });
  }

  function canScroll(target, dx, dy, win) {
    let el = target && target.nodeType === 1 ? target : target && target.parentElement;
    const root = win.document.scrollingElement;
    while (el && el !== root && el !== win.document.body) {
      const cs = win.getComputedStyle(el);
      if (dy && /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) {
        if ((dy < 0 && el.scrollTop > 0) || (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1)) return true;
      }
      if (dx && /(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 1) {
        if ((dx < 0 && el.scrollLeft > 0) || (dx > 0 && el.scrollLeft + el.clientWidth < el.scrollWidth - 1)) return true;
      }
      el = el.parentElement;
    }
    // The board's own page: it grows past its frame when a step opens more of it. The root's
    // overflow is visible, so check its scroll range directly.
    if (root) {
      if (dy && (dy < 0 ? root.scrollTop > 0 : root.scrollTop + root.clientHeight < root.scrollHeight - 1)) return true;
      if (dx && (dx < 0 ? root.scrollLeft > 0 : root.scrollLeft + root.clientWidth < root.scrollWidth - 1)) return true;
    }
    return false;
  }

  // ---------- input ----------

  function handleWheel(dx, dy, mode, zoom, shift, sx, sy) {
    const unit = mode === 1 ? 16 : mode === 2 ? size.h : 1;
    dx *= unit;
    dy *= unit;
    if (zoom) {
      if (gestureZ) return; // Safari already zooms through gesture events
      zoomAt(sx, sy, view.z * Math.exp(-clamp(dy, -25, 25) * 0.01));
      return;
    }
    if (shift && !dx) {
      dx = dy;
      dy = 0;
    }
    setView({ z: view.z, x: view.x - dx, y: view.y - dy });
  }

  function local(e) {
    const r = viewport.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      stopAnim();
      const p = local(e);
      handleWheel(e.deltaX, e.deltaY, e.deltaMode, e.ctrlKey || e.metaKey, e.shiftKey, p.x, p.y);
    },
    { passive: false },
  );

  viewport.addEventListener("gesturestart", (e) => {
    e.preventDefault();
    gestureZ = view.z;
  });
  viewport.addEventListener("gesturechange", (e) => {
    if (!gestureZ) return;
    e.preventDefault();
    const p = local(e);
    zoomAt(p.x, p.y, gestureZ * e.scale);
  });
  viewport.addEventListener("gestureend", (e) => {
    e.preventDefault();
    gestureZ = 0;
  });

  function frameBoard(target) {
    const el = target && target.closest ? target.closest(".frame") : null;
    return el ? byId.get(el.dataset.id) || null : null;
  }

  viewport.addEventListener("pointerdown", (e) => {
    if (e.button === 2) return;
    if (e.target.closest("a, button")) return;
    if (e.button === 1) e.preventDefault();
    stopAnim();
    if (document.activeElement !== viewport) viewport.focus({ preventScroll: true });
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (e.pointerType === "touch") viewport.setPointerCapture(e.pointerId);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const mid = local({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
      pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: view.z, wx: (mid.x - view.x) / view.z, wy: (mid.y - view.y) / view.z };
      drag = null;
      return;
    }
    drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y, moved: false, board: frameBoard(e.target) };
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const mid = local({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
      const nz = clamp(pinch.z0 * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0), zMin(), Z_MAX);
      setView({ z: nz, x: mid.x - pinch.wx * nz, y: mid.y - pinch.wy * nz });
      return;
    }
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.moved) {
      if (Math.hypot(dx, dy) < 4) return;
      drag.moved = true;
      app.classList.add("panning");
      try {
        viewport.setPointerCapture(e.pointerId);
      } catch {
        // the pointer may already be gone
      }
    }
    setView({ z: view.z, x: drag.vx + dx, y: drag.vy + dy });
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pinch && pointers.size < 2) {
      pinch = null;
      drag = null;
      markMoving();
      return;
    }
    if (!drag || drag.id !== e.pointerId) return;
    const d = drag;
    drag = null;
    app.classList.remove("panning");
    if (d.moved) {
      markMoving();
      return;
    }
    if (e.type !== "pointerup" || e.button === 1) return;
    if (d.board) {
      const now = performance.now();
      const isDouble = lastClick.board === d.board && now - lastClick.t < 400;
      lastClick = { board: d.board, t: isDouble ? 0 : now };
      if (isDouble) focusBoard(d.board);
      else if (focused && focused !== d.board) {
        unfocus();
        select(d.board);
      } else select(d.board);
    } else {
      lastClick = { board: null, t: 0 };
      select(null);
    }
  }
  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);
  viewport.addEventListener("auxclick", (e) => {
    if (e.button === 1) e.preventDefault();
  });

  function isEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
  }

  function isPlainTarget(el) {
    if (!el || el.nodeType !== 1) return true;
    return !isEditable(el) && !el.closest("button, a, summary, [role='button'], [tabindex]:not([tabindex='-1'])");
  }

  function setSpace(on) {
    if (spaceDown === on) return;
    spaceDown = on;
    app.classList.toggle("space", on);
  }

  window.addEventListener("keydown", (e) => {
    const t = e.target;
    if (e.key === "Escape") {
      if (shortcuts.open) {
        shortcuts.open = false;
        shortcuts.querySelector("summary").focus();
        return;
      }
      if (focused) unfocus();
      else if (selected) select(null);
      return;
    }
    if (isEditable(t)) return;
    if (e.metaKey || e.ctrlKey) {
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoomStep(1);
      } else if (e.key === "-") {
        e.preventDefault();
        zoomStep(-1);
      }
      return;
    }
    if (e.altKey) return;
    if (e.shiftKey && e.code === "Digit1") {
      e.preventDefault();
      fitAll();
      return;
    }
    if (e.shiftKey && e.code === "Digit2") {
      e.preventDefault();
      if (selected) flyTo(fitView(selected));
      return;
    }
    if (e.shiftKey && e.code === "Digit0") {
      e.preventDefault();
      zoomTo100();
      return;
    }
    const inList = t && t.closest && t.closest("#boardList");
    switch (e.key) {
      case "+":
      case "=":
        e.preventDefault();
        zoomStep(1);
        return;
      case "-":
      case "_":
        e.preventDefault();
        zoomStep(-1);
        return;
      case "ArrowRight":
      case "ArrowDown":
      case "]":
      case "ArrowLeft":
      case "ArrowUp":
      case "[": {
        if (t && t.closest && t.closest("summary, .menu")) return;
        e.preventDefault();
        const dir = e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "]" ? 1 : -1;
        const next = step(dir);
        if (inList && next && next.item) next.item.focus({ preventScroll: true });
        return;
      }
      case "Enter":
        if (t !== viewport && t !== document.body) return;
        e.preventDefault();
        if (selected) focusBoard(selected);
        else step(1);
        return;
      case " ":
        if (!isPlainTarget(t) && t !== viewport) return;
        e.preventDefault();
        if (!e.repeat) setSpace(true);
        return;
      default:
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.key === " ") setSpace(false);
  });
  window.addEventListener("blur", () => {
    // focus moving into a board is not a real blur of the canvas keys, except for space
    setSpace(false);
  });

  window.addEventListener("hashchange", () => applyHash(true));

  // ---------- chrome ----------

  $("zoomIn").addEventListener("click", () => zoomStep(1));
  $("zoomOut").addEventListener("click", () => zoomStep(-1));
  $("zoomReset").addEventListener("click", zoomTo100);
  $("fitAll").addEventListener("click", () => fitAll());
  fitBoardBtn.addEventListener("click", () => {
    if (selected) flyTo(fitView(selected));
  });
  $("focusExit").addEventListener("click", unfocus);

  const SIDE_KEY = "hd-concepts-sidebar";
  const toggle = $("sidebarToggle");
  // Shows or hides the list for now; setSidebar also remembers the choice.
  function showSidebar(open) {
    app.classList.toggle("side-hidden", !open);
    toggle.setAttribute("aria-expanded", String(open));
    syncSize();
  }
  function setSidebar(open) {
    showSidebar(open);
    sideBeforeFocus = null; // a choice made while using a board stands when the board is left
    try {
      localStorage.setItem(SIDE_KEY, open ? "open" : "closed");
    } catch {
      // storage can be unavailable; the toggle still works for this visit
    }
  }
  try {
    if (localStorage.getItem(SIDE_KEY) === "closed") setSidebar(false);
  } catch {
    // ignore
  }
  toggle.addEventListener("click", () => setSidebar(app.classList.contains("side-hidden")));

  document.addEventListener("pointerdown", (e) => {
    if (shortcuts.open && !shortcuts.contains(e.target)) shortcuts.open = false;
  });

  // Keep the canvas point at the center of the view fixed when the viewport resizes. Called
  // directly when the board list toggles, so a view computed right after uses the new size.
  function syncSize() {
    const w = viewport.clientWidth;
    const h = viewport.clientHeight;
    if (w === size.w && h === size.h) return;
    view.x += (w - size.w) / 2;
    view.y += (h - size.h) / 2;
    size = { w, h };
    if (boards.length) apply();
  }
  new ResizeObserver(syncSize).observe(viewport);

  load();
})();
