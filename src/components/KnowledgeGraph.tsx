import {
  useEffect,
  useRef,
  useState,
  useCallback,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { GraphEdge, GraphNode } from "../domain/academic";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type Props = { nodes: GraphNode[]; edges: GraphEdge[] };

type SNode = GraphNode & {
  vx: number;
  vy: number;
  fx: number | null;
  fy: number | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Visual constants
// ─────────────────────────────────────────────────────────────────────────────
const BG        = "#fafafa";
const GRID_DOT  = "rgba(0,0,0,0.055)";
const LABEL_COL = "#374151";

const R: Record<string, number>      = { course: 34, concept: 23, resource: 14 };
const FILL: Record<string, string>   = { course: "#2d6a4f", concept: "#e07b39", resource: "#4a90d9" };
const STROKE: Record<string, string> = { course: "#1b4332", concept: "#b85c1e", resource: "#2c5f8a" };

const EDGE_ALPHA: Record<string, number>    = { contains: 0.22, prereq: 0.38, supports: 0.18 };
const EDGE_DASH: Record<string, number[]>   = { prereq: [5, 5] };

// ─────────────────────────────────────────────────────────────────────────────
// Physics — world origin is (0,0), nodes float around it
// ─────────────────────────────────────────────────────────────────────────────
const REPEL      = 300;
const SPRING_K   = 0.12;
const SPRING_LEN: Record<string, number> = { contains: 5, prereq: 4, supports: 3 };
const CENTER_G   = 0.003;   // soft pull toward world origin (0,0)
const DAMP       = 0.86;
const ALPHA_INIT = 1;
const ALPHA_DEC  = 0.006;   // settles in ~167 frames
const ALPHA_MIN  = 0.003;
const PRE_TICKS  = 120;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function clip(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "\u2026" : s;
}

/** All nodes start in concentric rings centred on world-origin (0,0). */
function initNodes(nodes: GraphNode[]): SNode[] {
  const total = nodes.length;
  return nodes.map((n, i) => {
    const angle = (i / total) * Math.PI * 2;
    // ring radii in world-pixels (independent of canvas size)
    const ring = n.kind === "course" ? 70 : n.kind === "concept" ? 145 : 220;
    return {
      ...n,
      x: Math.cos(angle) * ring,
      y: Math.sin(angle) * ring,
      vx: 0, vy: 0, fx: null, fy: null,
    };
  });
}

/** One physics tick. Center gravity always pulls toward (0,0). */
function runTick(nodes: SNode[], edges: GraphEdge[], alpha: number) {
  const map = new Map(nodes.map((n) => [n.id, n]));

  // repulsion
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = a.x - b.x || 0.01, dy = a.y - b.y || 0.01;
      const d2 = Math.max(dx * dx + dy * dy, 4);
      const f  = (REPEL * alpha) / d2;
      a.vx += dx * f; a.vy += dy * f;
      b.vx -= dx * f; b.vy -= dy * f;
    }
  }

  // edge springs
  for (const e of edges) {
    const a = map.get(e.from), b = map.get(e.to);
    if (!a || !b) continue;
    const dx = b.x - a.x, dy = b.y - a.y;
    const d  = Math.hypot(dx, dy) || 1;
    const tgt = SPRING_LEN[e.label] ?? 75;
    const f   = (d - tgt) * SPRING_K * alpha;
    const fx  = (dx / d) * f, fy = (dy / d) * f;
    a.vx += fx; a.vy += fy;
    b.vx -= fx; b.vy -= fy;
  }

  // center gravity toward (0,0)
  for (const n of nodes) {
    n.vx -= n.x * CENTER_G * alpha;
    n.vy -= n.y * CENTER_G * alpha;
  }

  // integrate
  for (const n of nodes) {
    if (n.fx !== null) { n.x = n.fx; n.y = n.fy!; n.vx = 0; n.vy = 0; continue; }
    n.vx *= DAMP; n.vy *= DAMP;
    n.x  += n.vx; n.y  += n.vy;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function KnowledgeGraph({ nodes, edges }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef    = useRef<SNode[]>([]);
  const alphaRef  = useRef(ALPHA_INIT);
  const rafRef    = useRef(0);
  const dimRef    = useRef({ w: 0, h: 0 });

  // pan: translates world-origin to canvas-center at init.
  // world (0,0) → canvas (pan.x, pan.y).
  // We always initialise pan = { x: w/2, y: h/2 } so (0,0) is the canvas centre.
  const panRef       = useRef({ x: 380, y: 220 });
  const panTargetRef = useRef<{ x: number; y: number } | null>(null); // smooth-centre target

  // interaction
  const hovRef     = useRef<SNode | null>(null);
  const focRef     = useRef<SNode | null>(null);
  const dragRef    = useRef<SNode | null>(null);
  const panningRef = useRef(false);
  const panOriRef  = useRef({ x: 0, y: 0 });

  const [tip, setTip] = useState<{
    node: SNode; x: number; y: number; cw: number; ch: number;
  } | null>(null);

  const reheat = (a = 0.4) => { alphaRef.current = Math.max(alphaRef.current, a); };

  // canvas-pixel → world
  const toWorld = (cx: number, cy: number) => ({
    x: cx - panRef.current.x,
    y: cy - panRef.current.y,
  });

  // hit-test
  const hit = (cx: number, cy: number): SNode | null => {
    const { x: wx, y: wy } = toWorld(cx, cy);
    return simRef.current.findLast(
      (n) => Math.hypot(n.x - wx, n.y - wy) <= (R[n.kind] ?? 10) + 5,
    ) ?? null;
  };

  // ── draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { w, h } = dimRef.current;
    const dpr = window.devicePixelRatio || 1;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // background
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);

    // dot grid (fixed to canvas, not world)
    const gs = 24;
    ctx.fillStyle = GRID_DOT;
    for (let gx = gs / 2; gx < w; gx += gs)
      for (let gy = gs / 2; gy < h; gy += gs) {
        ctx.beginPath(); ctx.arc(gx, gy, 0.8, 0, Math.PI * 2); ctx.fill();
      }

    // world transform: pan only
    ctx.save();
    ctx.translate(panRef.current.x, panRef.current.y);

    const snodes = simRef.current;
    const byId   = new Map(snodes.map((n) => [n.id, n]));
    const active = focRef.current ?? hovRef.current;

    const activeIds   = new Set<string>();
    const activeEdges = new Set<GraphEdge>();
    if (active) {
      activeIds.add(active.id);
      for (const e of edges) {
        if (e.from === active.id || e.to === active.id) {
          activeEdges.add(e);
          activeIds.add(e.from);
          activeIds.add(e.to);
        }
      }
    }

    // edges
    for (const e of edges) {
      const a = byId.get(e.from), b = byId.get(e.to);
      if (!a || !b) continue;
      const isLit   = !active || activeEdges.has(e);
      const alpha   = active ? (isLit ? 0.78 : 0.06) : (EDGE_ALPHA[e.label] ?? 0.22);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = "#6b7280";
      ctx.lineWidth   = isLit && active ? 1.5 : 1;
      ctx.setLineDash(EDGE_DASH[e.label] ?? []);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // nodes
    for (const n of snodes) {
      const r      = R[n.kind] ?? 10;
      const fill   = FILL[n.kind]   ?? "#888";
      const stroke = STROKE[n.kind] ?? "#444";
      const isSelf = n === active;
      const isNear = !active || activeIds.has(n.id);
      const opacity = active ? (isNear ? 1 : 0.14) : 1;

      ctx.save();
      ctx.globalAlpha = opacity;

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.lineWidth   = isSelf ? 2.5 : 1.5;
      ctx.strokeStyle = isSelf ? stroke : "rgba(255,255,255,0.75)";
      ctx.stroke();

      // labels
      const showLabel =
        n.kind === "course" ||
        (n.kind === "concept" && isNear) ||
        (n.kind === "resource" && isSelf);

      if (showLabel) {
        const fs = n.kind === "course" ? 9.5 : n.kind === "concept" ? 8 : 7;
        ctx.font         = `600 ${fs}px Inter, system-ui, sans-serif`;
        ctx.textAlign    = "center";
        ctx.textBaseline = "middle";

        if (n.kind === "course") {
          ctx.fillStyle = "#fff";
          ctx.fillText(clip(n.label, 5), n.x, n.y);
        } else {
          const ly = n.y + r + 10;
          ctx.fillStyle   = LABEL_COL;
          ctx.shadowColor = BG;
          ctx.shadowBlur  = 5;
          ctx.fillText(clip(n.label, n.kind === "concept" ? 22 : 18), n.x, ly);
          ctx.shadowBlur  = 0;
        }
      }

      ctx.restore();
    }

    ctx.restore();
  }, [edges]);

  // ── simulation + pan-animation loop ──────────────────────────────────────
  const loopRef = useRef<() => void>(() => {});
  loopRef.current = () => {
    // smooth pan animation toward target (for click-to-centre)
    const pt = panTargetRef.current;
    if (pt) {
      const dx = pt.x - panRef.current.x;
      const dy = pt.y - panRef.current.y;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
        panRef.current = pt;
        panTargetRef.current = null;
      } else {
        panRef.current = { x: panRef.current.x + dx * 0.14, y: panRef.current.y + dy * 0.14 };
      }
    }

    // physics
    const alpha = alphaRef.current;
    if (alpha > ALPHA_MIN || dragRef.current) {
      runTick(simRef.current, edges, alpha);
      alphaRef.current = Math.max(0, alpha - ALPHA_DEC);
    }

    draw();
    rafRef.current = requestAnimationFrame(() => loopRef.current());
  };

  // ── init / resize ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr  = window.devicePixelRatio || 1;
      const w    = Math.max(320, Math.floor(rect.width));
      const h    = Math.max(220, Math.floor(rect.height));
      dimRef.current = { w, h };
      canvas.width   = w * dpr;
      canvas.height  = h * dpr;

      // Build fresh nodes (centred at world origin)
      const sn = initNodes(nodes);
      let a = ALPHA_INIT;
      for (let t = 0; t < PRE_TICKS; t++) {
        runTick(sn, edges, a);
        a = Math.max(0, a - ALPHA_DEC);
      }
      simRef.current = sn;
      alphaRef.current = a;

      // Focus the first course node at startup
      const initialCourse = sn.find(n => n.kind === "course");

      if (initialCourse) {
        focRef.current = initialCourse;

        panRef.current = {
          x: w / 2 - initialCourse.x,
          y: h / 2 - initialCourse.y,
        };
      } else {
        focRef.current = null;
        panRef.current = { x: w / 2, y: h / 2 };
      }

      panTargetRef.current = null;
      hovRef.current = null;
      focRef.current       = null;
      hovRef.current       = null;
    };

    // Wait until browser has finished layout before measuring canvas
    const initRaf = requestAnimationFrame(() => {
      setup();
    });

    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();

      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(220, Math.floor(rect.height));

      // Don't rebuild everything unless size actually changed
      if (w === dimRef.current.w && h === dimRef.current.h) return;

      setup();
    });

    ro.observe(canvas);

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => loopRef.current());

    return () => {
      ro.disconnect();
      cancelAnimationFrame(initRaf);
      cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length, edges.length]);

  // ── pointer handlers ───────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    const h = hit(cx, cy);
    if (h) {
      dragRef.current = h;
      h.fx = h.x; h.fy = h.y;
      reheat(0.3);
    } else {
      panningRef.current = true;
      panOriRef.current  = { x: cx - panRef.current.x, y: cy - panRef.current.y };
      // cancel any in-progress pan animation when user starts dragging canvas
      panTargetRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    const w = toWorld(cx, cy);

    if (dragRef.current) {
      dragRef.current.fx = w.x; dragRef.current.fy = w.y;
      reheat(0.15);
      return;
    }
    if (panningRef.current) {
      panRef.current       = { x: cx - panOriRef.current.x, y: cy - panOriRef.current.y };
      panTargetRef.current = null;
      return;
    }

    const h = hit(cx, cy);
    hovRef.current = h;
    canvas.style.cursor = h ? "pointer" : "grab";
    if (h) setTip({ node: h, x: cx, y: cy, cw: dimRef.current.w, ch: dimRef.current.h });
    else   setTip(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerUp = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;

    if (dragRef.current) {
      const n = dragRef.current;
      const moved = Math.hypot((n.fx ?? n.x) - n.x, (n.fy ?? n.y) - n.y) > 4;

      if (!moved) {
        // click: toggle focus + smoothly centre on node
        const isAlreadyFocused = focRef.current?.id === n.id;
        focRef.current = isAlreadyFocused ? null : n;

        if (!isAlreadyFocused) {
          // Animate pan so node lands at canvas centre:
          // canvas pos of node = n.x + pan.x = w/2  ⟹  pan.x = w/2 - n.x
          const { w: cw, h: ch } = dimRef.current;
          panTargetRef.current = { x: cw / 2 - n.x, y: ch / 2 - n.y };
        }
      }

      n.fx = null; n.fy = null;
      dragRef.current = null;

    } else if (panningRef.current) {
      panningRef.current = false;
      if (!hit(cx, cy)) focRef.current = null;
    }

    canvas.style.cursor = "grab";
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerLeave = useCallback(() => {
    hovRef.current = null;
    setTip(null);
    if (dragRef.current) {
      dragRef.current.fx = null; dragRef.current.fy = null;
      dragRef.current = null;
    }
    panningRef.current = false;
  }, []);

  // ── render ─────────────────────────────────────────────────────────────────
  const legend = [
    { color: FILL.course,   label: "Course"   },
    { color: FILL.concept,  label: "Concept"  },
    { color: FILL.resource, label: "Resource" },
  ];

  return (
    <section className="panel graph-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Knowledge graph</p>
          <h2>KTU subjects, concepts, resources</h2>
        </div>
        <span className="graph-hint">Drag canvas &middot; drag nodes &middot; click node to focus</span>
      </div>

      <div className="graph-wrap">
        <canvas
          ref={canvasRef}
          className="graph-canvas"
          aria-label="CogniGraph knowledge graph"
          style={{ cursor: "grab" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
        />

        <div className="graph-legend">
          {legend.map(({ color, label }) => (
            <span key={label} className="graph-legend-item">
              <span className="graph-legend-dot" style={{ background: color }} />
              {label}
            </span>
          ))}
        </div>

        {tip && (
          <div
            className={`graph-tip ${tip.node.kind}`}
            style={{
              left: Math.min(tip.x + 14, tip.cw - 180),
              top:  Math.max(8, tip.y - 48),
            }}
          >
            <strong>{tip.node.label}</strong>
            <span>{tip.node.kind}</span>
          </div>
        )}
      </div>
    </section>
  );
}
