import React, { useState, useMemo, useRef } from "react";
import { Sun, Moon, Compass, ShieldCheck } from "lucide-react";


const LAT = 12.9716, LON = 77.5946, RAD = Math.PI / 180;
const NAVY = "#252A2A", ORANGE = "#B89416";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CARD = ["North", "East", "South", "West"];
const WALL = ["Front", "Right", "Back", "Left"];

const FACINGS = {
  East:  { n: 90,  note: "Gentle morning light floods the entrance side. Ideal for kitchens, pooja rooms and living areas, and it keeps afternoon heat off the front." },
  North: { n: 0,   note: "Soft, even light all day with almost no harsh glare. A strong choice for studies, studios and living rooms." },
  West:  { n: 270, note: "The front takes strong afternoon sun. Deep overhangs, a verandah or a tree buffer will keep front rooms cool." },
  South: { n: 180, note: "Bright midday sun on the front. Shade it carefully and it pays back in winter warmth and daylight." },
};
const DATES = [["Today", null], ["21 Mar", 80], ["21 Jun", 172], ["22 Sep", 265], ["21 Dec", 355]];
const VIEWS = { Perspective: [205, 30], Plan: [180, 89], Elevation: [180, 9] };

/* ---------- small math helpers ---------- */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const toRgb = (c) => (c[0] === "#" ? [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)) : c.match(/\d+/g).slice(0, 3).map(Number));
const mix = (a, b, t) => { const A = toRgb(a), B = toRgb(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * clamp(t, 0, 1))).join(",")})`; };
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const rotZ = (p, t) => [p[0] * Math.cos(t) + p[1] * Math.sin(t), -p[0] * Math.sin(t) + p[1] * Math.cos(t), p[2]];
const hull = (pts) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...p].reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
};
const fmtT = (h) => { const m = Math.round(h * 60), hh = Math.floor(m / 60) % 24, mm = m % 60; return `${hh % 12 || 12}:${String(mm).padStart(2, "0")} ${hh >= 12 ? "PM" : "AM"}`; };
const dayOfYear = (d) => Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
const dateLabel = (N) => { const d = new Date(2025, 0, N); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const compass8 = (deg) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round((((deg % 360) + 360) % 360) / 45) % 8];

/* ---------- solar model ---------- */
const dayInfo = (N) => {
  const B = (2 * Math.PI * (N - 81)) / 365;
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B); // minutes
  const corr = ((LON - 82.5) * 4 + eot) / 60; // solar time − IST, hours
  const decl = 23.44 * RAD * Math.sin((2 * Math.PI * (284 + N)) / 365);
  const h0 = Math.acos(clamp(-Math.tan(LAT * RAD) * Math.tan(decl), -1, 1)) / RAD / 15;
  return { decl, corr, rise: 12 - h0 - corr, set: 12 + h0 - corr, noon: 12 - corr, len: 2 * h0 };
};
const sunPos = (d, clock) => {
  const H = (clock + d.corr - 12) * 15 * RAD, phi = LAT * RAD;
  const sinA = Math.sin(phi) * Math.sin(d.decl) + Math.cos(phi) * Math.cos(d.decl) * Math.cos(H);
  const alt = Math.asin(clamp(sinA, -1, 1));
  let az = Math.acos(clamp((Math.sin(d.decl) - sinA * Math.sin(phi)) / (Math.cos(alt) * Math.cos(phi) || 1e-6), -1, 1));
  if (H > 0) az = 2 * Math.PI - az;
  return { alt, az };
};
const dni = (alt) => {
  if (alt <= 0) return 0;
  const am = 1 / (Math.sin(alt) + 0.50572 * Math.pow(alt / RAD + 6.07995, -1.6364));
  return 1353 * Math.pow(0.7, Math.pow(am, 0.678));
};
const irr = (pos, n) => { const D = dni(pos.alt); return n === "roof" ? D * Math.sin(pos.alt) : D * Math.max(0, Math.cos(pos.alt) * Math.cos(pos.az - n)); };
const sunVec = ({ alt, az }) => [Math.cos(alt) * Math.sin(az), Math.cos(alt) * Math.cos(az), Math.sin(alt)];

/* ---------- geometry ---------- */
const boxFaces = ([x0, x1, y0, y1, z0, z1]) => [
  { q: [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], n: [0, 1, 0], k: "front" },
  { q: [[x1, y0, z0], [x0, y0, z0], [x0, y0, z1], [x1, y0, z1]], n: [0, -1, 0], k: "back" },
  { q: [[x1, y1, z0], [x1, y0, z0], [x1, y0, z1], [x1, y1, z1]], n: [1, 0, 0], k: "right" },
  { q: [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], n: [-1, 0, 0], k: "left" },
  { q: [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], n: [0, 0, 1], k: "roof" },
];
const HOUSE = [-4, 4, -3, 3, 0.35, 5], CANOPY = [-1.7, 1.7, 3, 4.4, 3.1, 3.4], PLINTH = [-4.5, 4.5, -3.5, 3.5, 0, 0.35];
const GLASS = {
  front: [[[-3.4, 3.02, 1.6], [-2, 3.02, 1.6], [-2, 3.02, 3.9], [-3.4, 3.02, 3.9]], [[2, 3.02, 1.6], [3.4, 3.02, 1.6], [3.4, 3.02, 3.9], [2, 3.02, 3.9]]],
  back:  [[[2.6, -3.02, 1.6], [0.8, -3.02, 1.6], [0.8, -3.02, 3.9], [2.6, -3.02, 3.9]], [[-0.8, -3.02, 1.6], [-2.6, -3.02, 1.6], [-2.6, -3.02, 3.9], [-0.8, -3.02, 3.9]]],
  right: [[[4.02, 1.6, 1.6], [4.02, -1.6, 1.6], [4.02, -1.6, 3.9], [4.02, 1.6, 3.9]]],
  left:  [[[-4.02, -1.6, 1.6], [-4.02, 1.6, 1.6], [-4.02, 1.6, 3.9], [-4.02, -1.6, 3.9]]],
};
const DOOR = [[-0.7, 3.02, 0.35], [0.7, 3.02, 0.35], [0.7, 3.02, 2.8], [-0.7, 3.02, 2.8]];
const PLOT = 9, RS = 13, VW = 640, VH = 460, S = 15, CX = 320, CY = 235;

/* ============================================================================
   COMPONENT
============================================================================ */
export default function SunPathSimulator() {
  const [clock, setClock] = useState(15);
  const [day, setDay] = useState(() => dayOfYear(new Date()));
  const [facing, setFacing] = useState("East");
  const [yaw, setYaw] = useState(VIEWS.Perspective[0]);
  const [pitch, setPitch] = useState(VIEWS.Perspective[1]);
  const drag = useRef(null);

  const info = useMemo(() => dayInfo(day), [day]);
  const pos = sunPos(info, clock);
  const altD = pos.alt / RAD, azD = pos.az / RAD;
  const theta = FACINGS[facing].n * RAD;
  const wallAz = (i) => theta + (i * Math.PI) / 2;

  /* ---- per-wall daily stats ---- */
  const stats = useMemo(() => {
    const w = [0, 1, 2, 3].map((i) => ({ i, hrs: 0, kwh: 0, first: null, last: null }));
    for (let t = 4; t <= 20; t += 0.05) {
      const p = sunPos(info, t);
      if (p.alt <= 0) continue;
      w.forEach((x) => {
        const v = irr(p, wallAz(x.i));
        if (v > 40) { x.hrs += 0.05; x.kwh += (v * 0.05) / 1000; if (x.first === null) x.first = t; x.last = t; }
      });
    }
    return w;
  }, [info, facing]); // eslint-disable-line

  /* ---- 3D scene ---- */
  const scene = useMemo(() => {
    const y = yaw * RAD, p = pitch * RAD;
    const c = [Math.cos(p) * Math.sin(y), Math.cos(p) * Math.cos(y), Math.sin(p)];
    const r = [-Math.cos(y), Math.sin(y), 0], u = cross(c, r);
    const P = (q) => [CX + S * dot(q, r), CY - S * dot(q, u)];
    const D = (q) => dot(q, c);
    const str = (arr) => arr.map((q) => P(q).map((v) => v.toFixed(1)).join(",")).join(" ");
    const R3 = (q) => rotZ(q, theta);

    const s = sunVec(pos), up = pos.alt > 0;
    const dayK = clamp((altD + 4) / 14, 0, 1), glow = clamp(1 - Math.abs(altD - 1) / 9, 0, 1);
    const skyTop = mix(mix("#00060C", "#38BDF8", dayK), "#7A3510", glow * 0.35);
    const skyBot = mix(mix("#0B1E30", "#DCEFFB", dayK), "#F2D66D", glow * 0.75);
    const warm = clamp(1 - altD / 35, 0, 1);
    const lit = mix("#FFFFFF", "#FFB27A", warm), base = mix("#0F1B28", "#2A3B4E", dayK);

    /* faces */
    const boxes = [[PLINTH, -100, false], [HOUSE, 0, true], [CANOPY, 0, false]];
    const faces = [];
    boxes.forEach(([b, bias, deco]) => boxFaces(b).forEach((f) => {
      const n = R3(f.n);
      if (dot(n, c) <= 0.001) return;
      const q = f.q.map(R3), cen = q.reduce((a, v) => [a[0] + v[0] / 4, a[1] + v[1] / 4, a[2] + v[2] / 4], [0, 0, 0]);
      const I = up ? (f.k === "roof" ? 0.45 : 0.3) + (f.k === "roof" ? 0.55 : 0.7) * Math.max(0, dot(n, s)) : 0.1;
      const glass = deco && GLASS[f.k] ? GLASS[f.k].map((g) => g.map(R3)) : [];
      faces.push({ q, key: bias + D(cen), fill: mix(base, lit, I), I, glass, door: deco && f.k === "front" ? DOOR.map(R3) : null, top: f.k === "roof" });
    }));
    faces.sort((a, b) => a.key - b.key);

    /* shadow: hull of house + canopy projected to the ground along the sun ray */
    let shadow = null;
    if (up && pos.alt > 0.5 * RAD) {
      const pts = [];
      [HOUSE, CANOPY].forEach(([x0, x1, y0, y1, z0, z1]) => [x0, x1].forEach((x) => [y0, y1].forEach((yy) => [z0, z1].forEach((z) => {
        const q = R3([x, yy, z]), k = Math.min(q[2] / Math.max(s[2], 0.05), 30);
        pts.push([q[0] - s[0] * k, q[1] - s[1] * k], [q[0], q[1]]);
      }))));
      shadow = hull(pts).map((h) => [h[0], h[1], 0]);
    }

    /* sun-path dome */
    const dome = (d) => { const segs = { back: "", front: "" }; let prev = null;
      for (let t = Math.ceil(d.rise * 4) / 4; t <= d.set; t += 0.25) {
        const sp = sunPos(d, t), v = sunVec(sp).map((k) => k * RS), sc = P(v);
        if (prev) { const g = (D(v) + D(prev.v)) / 2 < 0 ? "back" : "front"; segs[g] += `M${prev.sc[0].toFixed(1)},${prev.sc[1].toFixed(1)}L${sc[0].toFixed(1)},${sc[1].toFixed(1)}`; }
        prev = { v, sc };
      } return segs; };
    const paths = [[dome(dayInfo(172)), false], [dome(dayInfo(355)), false], [dome(info), true]];
    const dots = [];
    for (let h = Math.ceil(info.rise); h <= info.set; h++) { const v = sunVec(sunPos(info, h)).map((k) => k * RS); dots.push({ v, sc: P(v), back: D(v) < 0, label: h % 3 === 0 ? `${h % 12 || 12}${h < 12 ? "a" : "p"}` : null }); }
    const sv = s.map((k) => k * RS);

    const G = PLOT;
    const grid = []; for (let g = -G; g <= G; g += 3) { grid.push([P([g, -G, 0]), P([g, G, 0])], [P([-G, g, 0]), P([G, g, 0])]); }
    return { P, str, skyTop, skyBot, dayK, faces, shadow, paths, dots, grid, sunP: P(sv), sunBack: D(sv) < 0, sunUp: up, houseTop: P([0, 0, 5]),
      plot: str([[-G, -G, 0], [G, -G, 0], [G, G, 0], [-G, G, 0]]), labels: [["N", 0, G + 1.6], ["E", G + 1.6, 0], ["S", 0, -G - 1.6], ["W", -G - 1.6, 0]].map(([t, x, yy]) => [t, ...P([x, yy, 0])]) };
  }, [yaw, pitch, theta, pos.alt, pos.az, info]); // eslint-disable-line

  /* ---- day chart ---- */
  const chart = useMemo(() => {
    const line = (n) => { let d = ""; for (let t = 5; t <= 19; t += 0.25) { const v = irr(sunPos(info, t), n); d += `${d ? "L" : "M"}${(((t - 5) / 14) * 480).toFixed(1)},${(74 - (v / 1000) * 66).toFixed(1)}`; } return d; };
    return [[line(wallAz(0)), ORANGE, 2.5, ""], [line(wallAz(1)), NAVY, 2, ""], [line(wallAz(2)), "#64748B", 1.8, "5 4"], [line(wallAz(3)), "#94A3B8", 1.8, "2 4"]];
  }, [info, facing]); // eslint-disable-line

  const rows = stats.map((w) => ({ ...w, label: WALL[w.i], dir: CARD[(FACINGS[facing].n / 90 + w.i) % 4], now: irr(pos, wallAz(w.i)) }));
  const hottest = [...rows].sort((a, b) => b.kwh - a.kwh)[0], front = rows[0];
  const xNow = ((clamp(clock, 5, 19) - 5) / 14) * 480;

  const onDown = (e) => { drag.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const onMove = (e) => {
    const d = drag.current; if (!d) return;
    setYaw((v) => v - (e.clientX - d.x) * 0.5);
    if (e.pointerType === "mouse") setPitch((v) => clamp(v + (e.clientY - d.y) * 0.4, 9, 89));
    drag.current = { x: e.clientX, y: e.clientY };
  };
  const onKey = (e) => { if (e.key === "ArrowLeft") setYaw((v) => v + 8); if (e.key === "ArrowRight") setYaw((v) => v - 8); };
  const glassFill = (I) => (pos.alt > 0 ? mix("#0B1E30", "#9FD8FF", I * 0.7) : "#FFC46B");

  return (
    <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 bg-white rounded-3xl border border-black/5 shadow-sm p-4 sm:p-6 md:p-8">
      <style>{`.sp-range{-webkit-appearance:none;appearance:none;height:8px;border-radius:999px;outline:none;cursor:pointer;width:100%}
        .sp-range::-webkit-slider-thumb{-webkit-appearance:none;width:26px;height:26px;border-radius:50%;background:#fff;border:4px solid ${ORANGE};box-shadow:0 2px 10px rgba(255,102,0,.4)}
        .sp-range::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#fff;border:4px solid ${ORANGE}}
        .sp-scroll::-webkit-scrollbar{display:none}.sp-scroll{scrollbar-width:none}`}</style>

      {/* ===== LEFT: 3D scene + controls + chart ===== */}
      <div className="lg:col-span-7 min-w-0">
        <div className="rounded-2xl overflow-hidden bg-[#252A2A] p-1.5 sm:p-2 shadow-inner">
          <div className="relative rounded-xl overflow-hidden">
            <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full block cursor-grab active:cursor-grabbing select-none outline-none focus-visible:ring-2 focus-visible:ring-[#B89416]"
              style={{ touchAction: "pan-y" }} tabIndex={0} role="img" aria-label={`3D model of a ${facing.toLowerCase()}-facing house on ${dateLabel(day)} at ${fmtT(clock)}. Drag to rotate.`}
              onPointerDown={onDown} onPointerMove={onMove} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)} onKeyDown={onKey}>
              <defs>
                <linearGradient id="spSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={scene.skyTop} /><stop offset="1" stopColor={scene.skyBot} /></linearGradient>
                <radialGradient id="spGlow"><stop offset="0" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
                <clipPath id="spPlot"><polygon points={scene.plot} /></clipPath>
              </defs>
              <rect width={VW} height={VH} fill="url(#spSky)" />

              {/* ground */}
              <polygon points={scene.plot} fill={mix("#04121D", "#1E3448", scene.dayK)} stroke="#fff" strokeOpacity=".35" strokeWidth="1.5" />
              {scene.grid.map(([a, b], i) => <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#fff" strokeOpacity=".08" />)}
              {scene.labels.map(([t, x, y]) => <text key={t} x={x} y={y + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill={t === "N" ? ORANGE : "#fff"} opacity={t === "N" ? 1 : 0.7}>{t}</text>)}

              {/* rear sun-path + sun */}
              {scene.paths.map(([s, sel], i) => <path key={"b" + i} d={s.back} fill="none" stroke={sel ? ORANGE : "#fff"} strokeOpacity={sel ? 0.5 : 0.22} strokeWidth={sel ? 2 : 1} strokeDasharray={sel ? "5 5" : ""} />)}
              {scene.dots.filter((d) => d.back).map((d, i) => <circle key={"bd" + i} cx={d.sc[0]} cy={d.sc[1]} r="2" fill="#fff" opacity=".5" />)}
              {scene.sunUp && scene.sunBack && <Sun3D sc={scene.sunP} to={scene.houseTop} />}

              {/* shadow */}
              {scene.shadow && <polygon points={scene.str(scene.shadow)} fill="#000" opacity={0.42 * clamp(altD / 6, 0.3, 1)} clipPath="url(#spPlot)" />}

              {/* house */}
              {scene.faces.map((f, i) => (
                <g key={i}>
                  <polygon points={scene.str(f.q)} fill={f.fill} stroke={NAVY} strokeOpacity=".25" strokeWidth=".6" />
                  {f.glass.map((g, j) => <polygon key={j} points={scene.str(g)} fill={glassFill(f.I)} opacity=".92" stroke="#fff" strokeOpacity=".2" strokeWidth=".5" />)}
                  {f.door && <polygon points={scene.str(f.door)} fill={ORANGE} />}
                </g>
              ))}

              {/* front sun-path + sun */}
              {scene.paths.map(([s, sel], i) => <path key={"f" + i} d={s.front} fill="none" stroke={sel ? ORANGE : "#fff"} strokeOpacity={sel ? 0.9 : 0.35} strokeWidth={sel ? 2.2 : 1} strokeDasharray={sel ? "5 5" : ""} />)}
              {scene.dots.filter((d) => !d.back).map((d, i) => <circle key={"fd" + i} cx={d.sc[0]} cy={d.sc[1]} r="2.4" fill="#fff" />)}
              {scene.dots.filter((d) => d.label).map((d, i) => <text key={"l" + i} x={d.sc[0]} y={d.sc[1] - 8} textAnchor="middle" fontSize="12" fontWeight="600" fill="#fff" opacity=".8">{d.label}</text>)}
              {scene.sunUp && !scene.sunBack && <Sun3D sc={scene.sunP} to={scene.houseTop} />}
            </svg>

            {/* HUD */}
            <div className="absolute top-3 left-3 bg-[#252A2A]/70 backdrop-blur rounded-xl px-3 py-2 text-white pointer-events-none">
              <div className="text-lg sm:text-2xl font-bold leading-none">{fmtT(clock)}</div>
              <div className="text-[10px] sm:text-xs text-white/70 mt-1">{pos.alt > 0 ? `Altitude ${altD.toFixed(0)}° · ${compass8(azD)} ${azD.toFixed(0)}°` : "Sun below horizon"}</div>
            </div>
            <div className="absolute top-3 right-3 flex gap-1 bg-[#252A2A]/70 backdrop-blur rounded-full p-1">
              {Object.entries(VIEWS).map(([k, [yw, pt]]) => (
                <button key={k} onClick={() => { setYaw(yw); setPitch(pt); }} className="px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold text-white/80 hover:bg-white hover:text-[#252A2A] transition cursor-pointer">{k}</button>
              ))}
            </div>
            <div className="absolute bottom-2 left-3 text-[10px] text-white/60 pointer-events-none">Drag to rotate</div>
          </div>

          {/* Time slider */}
          <div className="px-3 sm:px-5 pt-5 pb-3">
            <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold text-white/60 mb-3 uppercase tracking-wider">
              <span className="inline-flex items-center gap-1.5"><Sun className="w-4 h-4" /> {fmtT(info.rise)}</span>
              <span>Solar noon {fmtT(info.noon)}</span>
              <span className="inline-flex items-center gap-1.5">{fmtT(info.set)} <Moon className="w-4 h-4" /></span>
            </div>
            <input type="range" min="5" max="19" step="0.25" value={clock} onChange={(e) => setClock(parseFloat(e.target.value))} aria-label="Time of day"
              className="sp-range" style={{ background: `linear-gradient(to right, ${ORANGE} ${((clock - 5) / 14) * 100}%, rgba(255,255,255,.2) ${((clock - 5) / 14) * 100}%)` }} />
          </div>
        </div>

        {/* Date */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#252A2A]/50">2. Date · {dateLabel(day)}</div>
            <div className="text-[11px] font-semibold text-[#252A2A]/50">Day length {Math.floor(info.len)}h {Math.round((info.len % 1) * 60)}m</div>
          </div>
          <div className="sp-scroll flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {DATES.map(([l, n]) => {
              const N = n ?? dayOfYear(new Date()), on = day === N;
              return <button key={l} onClick={() => setDay(N)} className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${on ? "bg-[#252A2A] text-white border-[#252A2A]" : "bg-white border-black/10 hover:border-[#B89416] hover:text-[#B89416]"}`}>{l}</button>;
            })}
          </div>
          <input type="range" min="1" max="365" value={day} onChange={(e) => setDay(parseInt(e.target.value))} aria-label="Day of year" className="sp-range mt-4"
            style={{ background: `linear-gradient(to right, ${NAVY} ${(day / 365) * 100}%, #e5e7eb ${(day / 365) * 100}%)` }} />
        </div>

        {/* Chart */}
        <div className="mt-6 rounded-2xl bg-[#F9FAFB] border border-black/5 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#252A2A]/50">Direct sun on each wall (W/m²)</div>
            <div className="flex gap-3 text-[10px] font-semibold text-[#252A2A]/60">{["Front", "Right", "Back", "Left"].map((l, i) => <span key={l} className="inline-flex items-center gap-1"><i className="inline-block w-3 h-0.5" style={{ background: chart[i][1] }} />{l}</span>)}</div>
          </div>
          <svg viewBox="0 0 480 96" className="w-full" aria-hidden="true">
            <rect x="0" y="0" width={((info.rise - 5) / 14) * 480} height="76" fill="#252A2A" opacity=".06" />
            <rect x={((info.set - 5) / 14) * 480} y="0" width={480 - ((info.set - 5) / 14) * 480} height="76" fill="#252A2A" opacity=".06" />
            {[0, 500, 1000].map((v) => <line key={v} x1="0" x2="480" y1={74 - (v / 1000) * 66} y2={74 - (v / 1000) * 66} stroke="#252A2A" strokeOpacity=".08" />)}
            {chart.map(([d, col, w, dash], i) => <path key={i} d={d} fill="none" stroke={col} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" />)}
            <line x1={xNow} x2={xNow} y1="0" y2="76" stroke={NAVY} strokeWidth="1.5" />
            {[6, 9, 12, 15, 18].map((h) => <text key={h} x={((h - 5) / 14) * 480} y="92" fontSize="10" textAnchor="middle" fill="#252A2A" opacity=".45">{h % 12 || 12}{h < 12 ? "a" : "p"}</text>)}
          </svg>
        </div>
      </div>

      {/* ===== RIGHT: facing + analysis ===== */}
      <div className="lg:col-span-5 flex flex-col gap-5 min-w-0">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#252A2A]/50 mb-3">1. Select plot entrance</div>
          <div className="grid grid-cols-4 gap-2">
            {Object.keys(FACINGS).map((f) => (
              <button key={f} onClick={() => setFacing(f)} aria-pressed={facing === f}
                className={`py-3 rounded-xl text-xs font-bold border transition cursor-pointer ${facing === f ? "bg-[#252A2A] text-white border-[#252A2A]" : "bg-white border-black/10 hover:border-[#B89416] hover:text-[#B89416]"}`}>{f}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[["Altitude", pos.alt > 0 ? `${altD.toFixed(1)}°` : "Below horizon"], ["Azimuth", `${azD.toFixed(0)}° ${compass8(azD)}`], ["Sunrise", fmtT(info.rise)], ["Sunset", fmtT(info.set)]].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-[#F9FAFB] border border-black/5 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#252A2A]/40">{l}</div>
              <div className="text-base font-bold text-[#252A2A] mt-0.5">{v}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-[#F9FAFB] border border-black/5 p-4 sm:p-5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#252A2A]/50 mb-4">3. Wall-by-wall analysis</div>
          <div className="space-y-4">
            {rows.map((r) => (
              <div key={r.label}>
                <div className="flex justify-between items-baseline text-xs mb-1.5 gap-2">
                  <span className="font-bold text-[#252A2A]">{r.label} <span className="font-medium text-[#252A2A]/50">· faces {r.dir}</span></span>
                  <span className="font-bold text-[#252A2A] tabular-nums">{Math.round(r.now)} <span className="font-medium text-[#252A2A]/40">W/m²</span></span>
                </div>
                <div className="h-2.5 rounded-full bg-black/10 overflow-hidden">
                  <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${clamp(r.now / 1000, 0, 1) * 100}%`, background: r.i === 0 ? ORANGE : NAVY }} />
                </div>
                <div className="text-[11px] text-[#252A2A]/50 mt-1.5">
                  {r.hrs > 0 ? `Direct sun ${fmtT(r.first)}–${fmtT(r.last)} · ${r.hrs.toFixed(1)} h · ${r.kwh.toFixed(1)} kWh/m²` : "No direct sun today"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-emerald-900 mb-1">{facing}-facing entrance</div>
            <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
              {FACINGS[facing].note} On {dateLabel(day)} the {hottest.label.toLowerCase()} wall ({hottest.dir}) collects the most sun energy at {hottest.kwh.toFixed(1)} kWh/m², so shade it first.
              {front.hrs === 0 ? " The front wall gets no direct sun today." : ""}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-[#252A2A]/40 leading-relaxed flex items-start gap-1.5"><Compass className="w-3.5 h-3.5 shrink-0 mt-px" /> Bengaluru 12.97°N, 77.59°E. Times in IST. Clear-sky direct-beam estimates for planning, not a substitute for a full energy model.</p>
      </div>
    </div>
  );
}

function Sun3D({ sc, to }) {
  return (
    <g pointerEvents="none">
      <line x1={sc[0]} y1={sc[1]} x2={to[0]} y2={to[1]} stroke="#fff" strokeOpacity=".4" strokeDasharray="3 5" />
      <circle cx={sc[0]} cy={sc[1]} r="40" fill="url(#spGlow)" />
      <circle cx={sc[0]} cy={sc[1]} r="11" fill="#fff" />
    </g>
  );
}