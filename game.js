"use strict";

const WORLD = { w: 960, h: 540 };

const $ = (id) => document.getElementById(id);

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function len(x, y) {
  return Math.hypot(x, y);
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nowSec() {
  return performance.now() / 1000;
}

function formatSeconds(s) {
  return s.toFixed(1);
}

function dot(ax, ay, bx, by) {
  return ax * bx + ay * by;
}

function nearestPointOnSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const denom = abx * abx + aby * aby;
  const t = denom > 0 ? clamp((apx * abx + apy * aby) / denom, 0, 1) : 0;
  return { x: ax + abx * t, y: ay + aby * t, t };
}

function addLog(kind, tag, text) {
  const row = document.createElement("div");
  row.className = "line";
  const a = document.createElement("div");
  a.className = "tag";
  a.textContent = tag;
  const b = document.createElement("div");
  b.className = kind;
  b.textContent = text;
  row.appendChild(a);
  row.appendChild(b);
  const log = $("log");
  log.appendChild(row);
  log.scrollTop = log.scrollHeight;
}

function flashOverlay() {
  const overlay = $("overlay");
  overlay.classList.add("show");
  window.setTimeout(() => overlay.classList.remove("show"), 160);
}

function circleAabbResolve(circle, rect) {
  const cx = circle.x;
  const cy = circle.y;
  const rx = rect.x;
  const ry = rect.y;
  const rw = rect.w;
  const rh = rect.h;

  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  const dx = cx - nx;
  const dy = cy - ny;
  const d = Math.hypot(dx, dy);
  if (d >= circle.r || d === 0) {
    if (d >= circle.r) return { hit: false };
    const left = Math.abs(cx - rx);
    const right = Math.abs(cx - (rx + rw));
    const top = Math.abs(cy - ry);
    const bottom = Math.abs(cy - (ry + rh));
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { hit: true, nx: -1, ny: 0, push: circle.r };
    if (m === right) return { hit: true, nx: 1, ny: 0, push: circle.r };
    if (m === top) return { hit: true, nx: 0, ny: -1, push: circle.r };
    return { hit: true, nx: 0, ny: 1, push: circle.r };
  }
  return { hit: true, nx: dx / d, ny: dy / d, push: circle.r - d };
}

function rayIntersectAabb(ox, oy, dx, dy, rect) {
  const minX = rect.x;
  const minY = rect.y;
  const maxX = rect.x + rect.w;
  const maxY = rect.y + rect.h;

  let tmin = -Infinity;
  let tmax = Infinity;

  if (dx === 0) {
    if (ox < minX || ox > maxX) return null;
  } else {
    const tx1 = (minX - ox) / dx;
    const tx2 = (maxX - ox) / dx;
    tmin = Math.max(tmin, Math.min(tx1, tx2));
    tmax = Math.min(tmax, Math.max(tx1, tx2));
  }

  if (dy === 0) {
    if (oy < minY || oy > maxY) return null;
  } else {
    const ty1 = (minY - oy) / dy;
    const ty2 = (maxY - oy) / dy;
    tmin = Math.max(tmin, Math.min(ty1, ty2));
    tmax = Math.min(tmax, Math.max(ty1, ty2));
  }

  if (tmax < tmin) return null;
  if (tmax < 0) return null;
  return { tEnter: tmin, tExit: tmax };
}

function raycastWorld(ox, oy, dx, dy, maxLen, walls) {
  let best = maxLen;

  const bounds = [
    { x: 0, y: -1000, w: 0, h: WORLD.h + 2000 }, // left
    { x: WORLD.w, y: -1000, w: 0, h: WORLD.h + 2000 }, // right
    { x: -1000, y: 0, w: WORLD.w + 2000, h: 0 }, // top
    { x: -1000, y: WORLD.h, w: WORLD.w + 2000, h: 0 }, // bottom
  ];

  for (const b of bounds) {
    const hit = rayIntersectAabb(ox, oy, dx, dy, b);
    if (!hit) continue;
    const t = hit.tEnter >= 0 ? hit.tEnter : hit.tExit;
    if (t >= 0 && t < best) best = t;
  }

  for (const r of walls) {
    const hit = rayIntersectAabb(ox, oy, dx, dy, r);
    if (!hit) continue;
    const t = hit.tEnter;
    if (t > 0.001 && t < best) best = t;
  }

  return best;
}

function bestKey(levelIndex) {
  return `vector_vault_best_v1_${levelIndex}`;
}

const LEVELS = [
  {
    name: "Level 1 — Training Bay",
    objective: "Collect 3 shards, then dock at the exit ring.",
    tip: "Brake near the ring to dock safely.",
    start: { x: 120, y: 270 },
    exit: { x: 860, y: 270, r: 26 },
    walls: [
      { x: 0, y: 0, w: 960, h: 24 },
      { x: 0, y: 516, w: 960, h: 24 },
      { x: 0, y: 0, w: 24, h: 540 },
      { x: 936, y: 0, w: 24, h: 540 },
      { x: 360, y: 90, w: 24, h: 360 },
    ],
    shards: [
      { x: 260, y: 160 },
      { x: 260, y: 380 },
      { x: 560, y: 270 },
    ],
    turrets: [
      { x: 520, y: 120, a: Math.PI * 0.2, omega: 0.55, range: 820, width: 10 },
    ],
  },
  {
    name: "Level 2 — Offset Corridors",
    objective: "Collect 4 shards. Watch for crossing beams.",
    tip: "Drift (Shift) keeps speed without constant thrust.",
    start: { x: 110, y: 90 },
    exit: { x: 850, y: 450, r: 26 },
    walls: [
      { x: 0, y: 0, w: 960, h: 24 },
      { x: 0, y: 516, w: 960, h: 24 },
      { x: 0, y: 0, w: 24, h: 540 },
      { x: 936, y: 0, w: 24, h: 540 },
      { x: 240, y: 24, w: 24, h: 320 },
      { x: 240, y: 396, w: 24, h: 120 },
      { x: 520, y: 120, w: 24, h: 396 },
      { x: 700, y: 24, w: 24, h: 280 },
    ],
    shards: [
      { x: 150, y: 420 },
      { x: 420, y: 70 },
      { x: 640, y: 430 },
      { x: 860, y: 110 },
    ],
    turrets: [
      { x: 420, y: 270, a: -1.0, omega: 0.85, range: 900, width: 10 },
      { x: 760, y: 360, a: 2.2, omega: -0.7, range: 900, width: 12 },
    ],
  },
  {
    name: "Level 3 — Pinball Atrium",
    objective: "Collect 5 shards, then dock at the exit ring.",
    tip: "Walls are bouncy now—use ricochets to reposition fast.",
    start: { x: 100, y: 450 },
    exit: { x: 860, y: 80, r: 26 },
    walls: [
      { x: 0, y: 0, w: 960, h: 24 },
      { x: 0, y: 516, w: 960, h: 24 },
      { x: 0, y: 0, w: 24, h: 540 },
      { x: 936, y: 0, w: 24, h: 540 },
      { x: 280, y: 70, w: 24, h: 400 },
      { x: 520, y: 110, w: 24, h: 320 },
      { x: 700, y: 70, w: 24, h: 400 },
      { x: 304, y: 220, w: 200, h: 22 },
      { x: 544, y: 320, w: 156, h: 22 },
      { x: 120, y: 320, w: 120, h: 22 },
    ],
    shards: [
      { x: 150, y: 120 },
      { x: 260, y: 450 },
      { x: 520, y: 70 },
      { x: 620, y: 270 },
      { x: 820, y: 450 },
    ],
    turrets: [
      { x: 520, y: 270, a: 0.5, omega: 0.75, range: 1000, width: 10 },
      { x: 760, y: 180, a: -1.1, omega: -0.6, range: 1000, width: 10 },
    ],
  },
  {
    name: "Level 4 — Vault Cycle",
    objective: "Collect 6 shards. Survive the sweep.",
    tip: "Sometimes slowing down is faster.",
    start: { x: 120, y: 270 },
    exit: { x: 860, y: 270, r: 26 },
    walls: [
      { x: 0, y: 0, w: 960, h: 24 },
      { x: 0, y: 516, w: 960, h: 24 },
      { x: 0, y: 0, w: 24, h: 540 },
      { x: 936, y: 0, w: 24, h: 540 },
      // Section dividers with "door gaps" (doors are dynamic gate walls).
      { x: 240, y: 24, w: 24, h: 216 },
      { x: 240, y: 320, w: 24, h: 196 },
      { x: 480, y: 24, w: 24, h: 216 },
      { x: 480, y: 320, w: 24, h: 196 },
      { x: 720, y: 24, w: 24, h: 216 },
      { x: 720, y: 320, w: 24, h: 196 },
      { x: 264, y: 140, w: 216, h: 24 },
      { x: 504, y: 380, w: 216, h: 24 },
    ],
    gates: [
      {
        id: "gate1",
        opensOnSection: 0,
        walls: [{ x: 240, y: 240, w: 24, h: 80 }],
        beamWalls: [{ x: 240, y: 240, w: 24, h: 80 }],
        beamOpensOnSection: 1,
      },
      {
        id: "gate2",
        opensOnSection: 1,
        walls: [{ x: 480, y: 240, w: 24, h: 80 }],
        beamWalls: [{ x: 480, y: 240, w: 24, h: 80 }],
        beamOpensOnSection: 2,
      },
      {
        id: "gate3",
        opensOnSection: 2,
        walls: [{ x: 720, y: 240, w: 24, h: 80 }],
        beamWalls: [{ x: 720, y: 240, w: 24, h: 80 }],
        beamOpensOnSection: 3,
      },
    ],
    shards: [
      { x: 120, y: 90, section: 0 },
      { x: 120, y: 450, section: 0 },
      { x: 360, y: 310, section: 1 },
      { x: 360, y: 90, section: 1 },
      { x: 600, y: 220, section: 2 },
      { x: 840, y: 450, section: 3 },
    ],
    turrets: [
      { x: 360, y: 120, a: 1.2, omega: 1.1, range: 1000, width: 12 },
      { x: 600, y: 420, a: -2.0, omega: -1.0, range: 1000, width: 12 },
    ],
  },
];

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.scaleX = 1;
    this.scaleY = 1;
    this.lastT = nowSec();

    this.levelIndex = 0;
    this.level = null;
    this.player = null;
    this.shards = [];
    this.turrets = [];
    this.staticWalls = [];
    this.gates = [];
    this.staticBeamWalls = [];

    this.time = 0;
    this.attempts = 0;
    this.chargeMax = 160;
    this.charge = this.chargeMax;
    this.fx = true;
    this.paused = false;
    this.won = false;
    this.lockedUntil = 0;
    this.trail = [];
    this.exitMsg = { missingAt: -999, fastAt: -999 };

    this.keys = new Set();
    this.setupInput();
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  setupInput() {
    window.addEventListener("keydown", (e) => {
      if (e.repeat) return;
      const k = e.key;
      if (k === "p" || k === "P") {
        e.preventDefault();
        this.togglePause();
        return;
      }
      if (k === "r" || k === "R") {
        e.preventDefault();
        this.restartLevel("Restarted.");
        return;
      }
      if (k === "n" || k === "N") {
        e.preventDefault();
        this.nextLevel();
        return;
      }
      if (k === " ") e.preventDefault();
      this.keys.add(k);
    });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.key);
    });

    $("restartBtn").addEventListener("click", () => this.restartLevel("Restarted."));
    $("nextBtn").addEventListener("click", () => this.nextLevel());
    $("pauseBtn").addEventListener("click", () => this.togglePause());
    $("toggleFxBtn").addEventListener("click", () => {
      this.fx = !this.fx;
      addLog("sys", "SYS", this.fx ? "FX enabled." : "FX disabled.");
    });
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
    const w = Math.max(2, Math.round(rect.width * dpr));
    const h = Math.max(2, Math.round(rect.height * dpr));
    this.canvas.width = w;
    this.canvas.height = h;
    this.scaleX = w / WORLD.w;
    this.scaleY = h / WORLD.h;
    this.ctx.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
  }

  loadLevel(index, msg) {
    this.levelIndex = clamp(index, 0, LEVELS.length - 1);
    this.level = LEVELS[this.levelIndex];
    this.player = { x: this.level.start.x, y: this.level.start.y, vx: 0, vy: 0, r: 10 };
    this.shards = this.level.shards.map((s, i) => ({
      id: `s${i}`,
      x: s.x,
      y: s.y,
      r: 10,
      got: false,
      section: typeof s.section === "number" ? s.section : 0,
    }));
    this.turrets = this.level.turrets.map((t) => ({ ...t, angle: t.a }));
    this.staticWalls = (this.level.walls || []).map((w) => ({ ...w }));
    this.gates = (this.level.gates || []).map((g) => ({
      id: g.id,
      opensOnSection: g.opensOnSection,
      opened: false,
      beamOpensOnSection:
        typeof g.beamOpensOnSection === "number" ? g.beamOpensOnSection : g.opensOnSection,
      beamOpened: false,
      walls: (g.walls || []).map((w) => ({ ...w })),
      beamWalls: (g.beamWalls || []).map((w) => ({ ...w })),
    }));
    this.staticBeamWalls = (this.level.beamWalls || []).map((w) => ({ ...w }));

    this.time = 0;
    this.charge = this.chargeMax;
    this.won = false;
    this.paused = false;
    this.lockedUntil = 0;
    this.trail = [];
    this.exitMsg = { missingAt: -999, fastAt: -999 };

    $("pauseBtn").textContent = "Pause";
    $("levelName").textContent = this.level.name;
    $("objective").textContent = this.level.objective;
    $("tipText").textContent = this.level.tip;
    $("shardsTotal").textContent = String(this.shards.length);
    $("nextBtn").disabled = true;
    $("statusPill").innerHTML = `Status <strong>RUN</strong>`;

    $("log").innerHTML = "";
    addLog("sys", "SYS", "Thrusters online. Avoid the lasers.");
    addLog("sys", "SYS", "Space or X brakes.");
    if (this.gates.length) addLog("sys", "SYS", "Clear a section’s shards to open the next door.");
    if (msg) addLog("sys", "SYS", msg);
  }

  activeWalls() {
    const walls = [...this.staticWalls];
    for (const g of this.gates) {
      if (g.opened) continue;
      for (const w of g.walls) walls.push(w);
    }
    return walls;
  }

  activeBeamWalls() {
    const walls = this.activeWalls();
    for (const w of this.staticBeamWalls) walls.push(w);
    for (const g of this.gates) {
      if (g.beamOpened) continue;
      for (const w of g.beamWalls) walls.push(w);
    }
    return walls;
  }

  restartLevel(msg) {
    this.attempts += 1;
    this.loadLevel(this.levelIndex, msg);
  }

  nextLevel() {
    if (!this.won) return;
    if (this.levelIndex >= LEVELS.length - 1) return;
    this.loadLevel(this.levelIndex + 1, "New vault segment loaded.");
  }

  togglePause() {
    if (this.won) return;
    this.paused = !this.paused;
    $("pauseBtn").textContent = this.paused ? "Resume" : "Pause";
    addLog("sys", "SYS", this.paused ? "Paused." : "Resumed.");
  }

  shardsCount() {
    let got = 0;
    for (const s of this.shards) if (s.got) got++;
    return got;
  }

  setStatus(text, kind) {
    const tag =
      kind === "bad"
        ? "ALERT"
        : kind === "good"
          ? "CLEAR"
          : kind === "warn"
            ? "WARN"
            : "RUN";
    $("statusPill").innerHTML = `Status <strong>${tag}</strong>`;
    addLog(kind || "sys", "SYS", text);
  }

  applyControls(dt) {
    const thrust = 1600;
    const drift = this.keys.has("Shift");
    const braking = this.keys.has(" ") || this.keys.has("x") || this.keys.has("X");

    const dirX =
      (this.keys.has("ArrowRight") || this.keys.has("d") || this.keys.has("D") ? 1 : 0) -
      (this.keys.has("ArrowLeft") || this.keys.has("a") || this.keys.has("A") ? 1 : 0);
    const dirY =
      (this.keys.has("ArrowDown") || this.keys.has("s") || this.keys.has("S") ? 1 : 0) -
      (this.keys.has("ArrowUp") || this.keys.has("w") || this.keys.has("W") ? 1 : 0);

    const wantsThrust = dirX !== 0 || dirY !== 0;
    const normalMaxSpeed = 950;

    if (wantsThrust) {
      const l = Math.hypot(dirX, dirY) || 1;
      const ax = (dirX / l) * thrust;
      const ay = (dirY / l) * thrust;
      this.player.vx += ax * dt;
      this.player.vy += ay * dt;
    }

    // Charge is now purely a stamina meter for sustained thrusting (no boost mode).
    if (wantsThrust) {
      const drain = drift ? 7 : 10;
      this.charge = clamp(this.charge - drain * dt, 0, this.chargeMax);
    } else {
      this.charge = clamp(this.charge + 18 * dt, 0, this.chargeMax);
    }

    const speed = Math.hypot(this.player.vx, this.player.vy);
    const maxSpeed = normalMaxSpeed;
    if (speed > maxSpeed) {
      const s = maxSpeed / speed;
      this.player.vx *= s;
      this.player.vy *= s;
    }

    // Drag tuned for a responsive feel. (0.65 / 0.15 was effectively a hard brake each frame.)
    const dragPerFrame = drift ? 0.995 : 0.985;
    const drag = Math.pow(dragPerFrame, dt * 60);
    this.player.vx *= drag;
    this.player.vy *= drag;

    if (braking) {
      const brakePerFrame = 0.86;
      const brake = Math.pow(brakePerFrame, dt * 60);
      this.player.vx *= brake;
      this.player.vy *= brake;
    }
  }

  integrate(dt) {
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    this.player.x = clamp(this.player.x, this.player.r, WORLD.w - this.player.r);
    this.player.y = clamp(this.player.y, this.player.r, WORLD.h - this.player.r);
  }

  collideWalls(dt) {
    let hitCount = 0;
    // Pinball-like, but stable: e slightly below 1 to avoid energy blow-ups from overlap resolution.
    const e = 0.92;
    const bounceFactor = 1 + e;
    const tangentDamp = 0.985;
    for (const r of this.activeWalls()) {
      const res = circleAabbResolve(this.player, r);
      if (!res.hit) continue;
      hitCount++;
      this.player.x += res.nx * res.push;
      this.player.y += res.ny * res.push;

      const vn = dot(this.player.vx, this.player.vy, res.nx, res.ny);
      if (vn < 0) {
        this.player.vx -= vn * res.nx * bounceFactor;
        this.player.vy -= vn * res.ny * bounceFactor;

        // Small damping on the tangential component to reduce jitter.
        const tx = -res.ny;
        const ty = res.nx;
        const vt = dot(this.player.vx, this.player.vy, tx, ty);
        this.player.vx -= vt * tx * (1 - tangentDamp);
        this.player.vy -= vt * ty * (1 - tangentDamp);
      }
      this.charge = clamp(this.charge - 1.0, 0, this.chargeMax);
    }

    if (hitCount > 0 && this.fx && nowSec() > this.lockedUntil) {
      this.lockedUntil = nowSec() + 0.08;
      flashOverlay();
    }

    // Extra clamp after bounces to prevent runaway speeds in tight corners.
    const speed = Math.hypot(this.player.vx, this.player.vy);
    const hardCap = 1400;
    if (speed > hardCap) {
      const s = hardCap / speed;
      this.player.vx *= s;
      this.player.vy *= s;
    }
  }

  updateTurrets(dt) {
    for (const t of this.turrets) {
      t.angle += t.omega * dt;
      if (t.angle > Math.PI) t.angle -= Math.PI * 2;
      if (t.angle < -Math.PI) t.angle += Math.PI * 2;
    }
  }

  beamSegment(turret) {
    const ox = turret.x;
    const oy = turret.y;
    const dx = Math.cos(turret.angle);
    const dy = Math.sin(turret.angle);
    const maxLen = turret.range;
    const t = raycastWorld(ox, oy, dx, dy, maxLen, this.activeBeamWalls());
    const ex = ox + dx * t;
    const ey = oy + dy * t;
    return { ax: ox, ay: oy, bx: ex, by: ey, width: turret.width };
  }

  checkLasers() {
    if (this.won) return;
    for (const t of this.turrets) {
      const seg = this.beamSegment(t);
      const p = nearestPointOnSegment(this.player.x, this.player.y, seg.ax, seg.ay, seg.bx, seg.by);
      const d = Math.hypot(this.player.x - p.x, this.player.y - p.y);
      if (d <= this.player.r + seg.width * 0.5) {
        this.onHit();
        return;
      }
    }
  }

  checkShards() {
    for (const s of this.shards) {
      if (s.got) continue;
      const d = Math.hypot(this.player.x - s.x, this.player.y - s.y);
      if (d <= this.player.r + s.r) {
        s.got = true;
        addLog("good", "GET", "Data shard secured.");
        if (this.fx) flashOverlay();
        this.maybeOpenGates();
      }
    }
  }

  maybeOpenGates() {
    if (!this.gates.length) return;
    const sections = new Map();
    for (const s of this.shards) {
      const key = s.section;
      if (!sections.has(key)) sections.set(key, { total: 0, got: 0 });
      const rec = sections.get(key);
      rec.total += 1;
      if (s.got) rec.got += 1;
    }

    const sorted = [...this.gates].sort((a, b) => a.opensOnSection - b.opensOnSection);
    for (const g of sorted) {
      const recDoor = sections.get(g.opensOnSection);
      const doorComplete = recDoor && recDoor.total > 0 && recDoor.got === recDoor.total;
      if (doorComplete && !g.opened) {
        g.opened = true;
        addLog("good", "GATE", "Section cleared. Door released.");
        if (this.fx) flashOverlay();
      }

      const recBeam = sections.get(g.beamOpensOnSection);
      const beamComplete = recBeam && recBeam.total > 0 && recBeam.got === recBeam.total;
      if (beamComplete && !g.beamOpened) {
        g.beamOpened = true;
        addLog("good", "SHIELD", "Laser shield dropped.");
        if (this.fx) flashOverlay();
      }
    }
  }

  checkExit() {
    if (this.won) return;
    const got = this.shardsCount();
    const total = this.shards.length;
    const ex = this.level.exit;
    const d = Math.hypot(this.player.x - ex.x, this.player.y - ex.y);
    const speed = Math.hypot(this.player.vx, this.player.vy);
    if (d <= ex.r + this.player.r) {
      if (got < total) {
        if (this.time - this.exitMsg.missingAt > 1.2) {
          this.exitMsg.missingAt = this.time;
          addLog("warn", "LOCK", "Exit ring locked. Shards missing.");
        }
        return;
      }
      if (speed > 85) {
        if (this.time - this.exitMsg.fastAt > 1.2) {
          this.exitMsg.fastAt = this.time;
          addLog("warn", "DOCK", "Too fast. Brake (X) to dock.");
        }
        return;
      }
      this.onWin();
    }
  }

  onHit() {
    this.attempts += 1;
    addLog("bad", "HIT", "Laser contact. Resetting run.");
    if (this.fx) flashOverlay();
    this.player.x = this.level.start.x;
    this.player.y = this.level.start.y;
    this.player.vx = 0;
    this.player.vy = 0;
    this.charge = clamp(this.charge - 12, 0, this.chargeMax);
    this.trail = [];
  }

  onWin() {
    this.won = true;
    const best = this.getBestTime();
    const t = this.time;
    if (best == null || t < best) {
      this.setBestTime(t);
      addLog("good", "SYS", `New best time: ${formatSeconds(t)}s`);
    } else {
      addLog("good", "SYS", `Docked. Time: ${formatSeconds(t)}s (best ${formatSeconds(best)}s)`);
    }
    $("nextBtn").disabled = this.levelIndex >= LEVELS.length - 1;
    $("statusPill").innerHTML = `Status <strong>CLEAR</strong>`;
    if (this.fx) flashOverlay();
  }

  getBestTime() {
    const raw = localStorage.getItem(bestKey(this.levelIndex));
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  }

  setBestTime(t) {
    localStorage.setItem(bestKey(this.levelIndex), String(t));
  }

  updateTrail(dt) {
    this.trail.push({ x: this.player.x, y: this.player.y, t: this.time });
    const maxAge = 0.55;
    while (this.trail.length && this.time - this.trail[0].t > maxAge) this.trail.shift();
    if (!this.fx) this.trail.length = 0;
  }

  updateUI() {
    $("timePill").innerHTML = `Time <strong>${formatSeconds(this.time)}</strong>s`;
    $("attemptPill").innerHTML = `Attempts <strong>${this.attempts}</strong>`;

    const got = this.shardsCount();
    $("shardsText").textContent = String(got);

    const pct = clamp((this.charge / this.chargeMax) * 100, 0, 100);
    $("chargeText").textContent = `${Math.round(pct)}%`;
    const bar = $("chargeBar");
    bar.style.width = `${pct}%`;
    bar.style.filter = pct < 25 ? "saturate(0.55) contrast(1.15)" : "none";

    const status = this.paused ? "PAUSE" : this.won ? "CLEAR" : "RUN";
    $("statusPill").innerHTML = `Status <strong>${status}</strong>`;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, WORLD.w, WORLD.h);

    // Background
    ctx.fillStyle = "#070a12";
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = "#0f1a3a";
    for (let y = 0; y <= WORLD.h; y += 30) ctx.fillRect(0, y, WORLD.w, 1);
    for (let x = 0; x <= WORLD.w; x += 30) ctx.fillRect(x, 0, 1, WORLD.h);
    ctx.restore();

    // Walls
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.strokeStyle = "rgba(118,228,255,0.18)";
    ctx.lineWidth = 2;
    for (const r of this.staticWalls) {
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
    }
    for (const g of this.gates) {
      if (g.opened) continue;
      ctx.fillStyle = "rgba(255,212,107,0.10)";
      ctx.strokeStyle = "rgba(255,212,107,0.30)";
      for (const r of g.walls) {
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      }
    }
    for (const g of this.gates) {
      if (g.beamOpened) continue;
      if (!g.beamWalls.length) continue;
      ctx.fillStyle = "rgba(255,94,122,0.07)";
      ctx.strokeStyle = "rgba(255,94,122,0.22)";
      for (const r of g.beamWalls) {
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
      }
    }
    ctx.restore();

    // Exit ring
    const exit = this.level.exit;
    const active = this.shardsCount() === this.shards.length;
    ctx.save();
    ctx.translate(exit.x, exit.y);
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = active ? "rgba(108,255,158,0.85)" : "rgba(255,212,107,0.65)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, exit.r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = active ? 0.18 : 0.10;
    ctx.fillStyle = active ? "rgba(108,255,158,1)" : "rgba(255,212,107,1)";
    ctx.beginPath();
    ctx.arc(0, 0, exit.r + 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Shards
    for (const s of this.shards) {
      if (s.got) continue;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = "rgba(118,228,255,0.9)";
      ctx.beginPath();
      ctx.arc(0, 0, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "rgba(118,228,255,1)";
      ctx.beginPath();
      ctx.arc(0, 0, s.r + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Lasers
    for (const t of this.turrets) {
      const seg = this.beamSegment(t);
      ctx.save();
      const grad = ctx.createLinearGradient(seg.ax, seg.ay, seg.bx, seg.by);
      grad.addColorStop(0, "rgba(255,94,122,0.65)");
      grad.addColorStop(1, "rgba(255,94,122,0.00)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = seg.width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(seg.ax, seg.ay);
      ctx.lineTo(seg.bx, seg.by);
      ctx.stroke();
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = "rgba(255,94,122,1)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(seg.ax, seg.ay);
      ctx.lineTo(seg.bx, seg.by);
      ctx.stroke();
      ctx.restore();

      // Turret body
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.fillStyle = "rgba(255,94,122,0.35)";
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(4, -3, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(t.angle);
      ctx.fillStyle = "rgba(255,94,122,0.85)";
      ctx.fillRect(0, -2, 16, 4);
      ctx.restore();
    }

    // Trail
    if (this.fx && this.trail.length > 1) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < this.trail.length - 1; i++) {
        const a = this.trail[i];
        const b = this.trail[i + 1];
        const age = this.time - a.t;
        const alpha = clamp(1 - age / 0.55, 0, 1) * 0.25;
        ctx.strokeStyle = `rgba(118,228,255,${alpha})`;
        ctx.lineWidth = lerp(8, 2, age / 0.55);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Player
    ctx.save();
    ctx.translate(this.player.x, this.player.y);
    const sp = Math.hypot(this.player.vx, this.player.vy);
    const glow = clamp(sp / 220, 0, 1);
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = `rgba(118,228,255,${0.10 + glow * 0.15})`;
    ctx.beginPath();
    ctx.arc(0, 0, this.player.r + 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "rgba(118,228,255,0.95)";
    ctx.beginPath();
    ctx.arc(0, 0, this.player.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(6,10,18,0.95)";
    ctx.beginPath();
    ctx.arc(3, -2, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (this.paused) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, 0, WORLD.w, WORLD.h);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "700 28px " + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = "center";
      ctx.fillText("PAUSED", WORLD.w / 2, WORLD.h / 2);
      ctx.restore();
    }

    if (this.won) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(0, 0, WORLD.w, WORLD.h);
      ctx.fillStyle = "rgba(108,255,158,0.92)";
      ctx.font = "800 26px " + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = "center";
      ctx.fillText("DOCKED", WORLD.w / 2, WORLD.h / 2 - 10);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "600 14px " + getComputedStyle(document.body).fontFamily;
      ctx.fillText("Press N or Next to continue", WORLD.w / 2, WORLD.h / 2 + 18);
      ctx.restore();
    }
  }

  tick() {
    const t = nowSec();
    let dt = t - this.lastT;
    this.lastT = t;
    dt = clamp(dt, 0, 1 / 20);

    if (!this.level) this.loadLevel(0);

    if (!this.paused && !this.won) {
      this.time += dt;
      this.applyControls(dt);
      this.integrate(dt);
      this.collideWalls(dt);
      this.updateTurrets(dt);
      this.checkLasers();
      this.checkShards();
      this.checkExit();
      this.updateTrail(dt);
    }

    this.updateUI();
    this.render();
    requestAnimationFrame(() => this.tick());
  }
}

const game = new Game($("game"));
game.loadLevel(0);
game.tick();
