import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { GraphEdge, GraphNode } from "../domain/academic";

type KnowledgeGraphProps = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type LayoutNode = GraphNode & {
  vx: number;
  vy: number;
};

const nodeRadius = {
  course: 24,
  concept: 18,
  resource: 8,
};

const nodeColors = {
  course: "#245d55",
  concept: "#bd6e3f",
  resource: "#4f83a7",
};

const edgeColors: Record<string, string> = {
  contains: "#9fb4ad",
  prereq: "#d08c5a",
  supports: "#78a6c8",
};

function shortLabel(label: string, maxLength: number) {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}.` : label;
}

function buildLayout(nodes: GraphNode[], edges: GraphEdge[], width: number, height: number) {
  const centerX = width / 2;
  const centerY = height / 2;
  const layoutNodes: LayoutNode[] = nodes.map((node, index) => {
    const angle = (index / nodes.length) * Math.PI * 2;
    const band = node.kind === "course" ? 0.28 : node.kind === "concept" ? 0.52 : 0.78;
    return {
      ...node,
      x: centerX + Math.cos(angle) * width * band * 0.42,
      y: centerY + Math.sin(angle) * height * band * 0.42,
      vx: 0,
      vy: 0,
    };
  });

  const nodeById = new Map(layoutNodes.map((node) => [node.id, node]));

  for (let tick = 0; tick < 260; tick += 1) {
    for (let i = 0; i < layoutNodes.length; i += 1) {
      for (let j = i + 1; j < layoutNodes.length; j += 1) {
        const a = layoutNodes[i];
        const b = layoutNodes[j];
        const dx = a.x - b.x || 0.01;
        const dy = a.y - b.y || 0.01;
        const distanceSq = Math.max(dx * dx + dy * dy, 80);
        const force = 420 / distanceSq;
        a.vx += dx * force;
        a.vy += dy * force;
        b.vx -= dx * force;
        b.vy -= dy * force;
      }
    }

    for (const edge of edges) {
      const from = nodeById.get(edge.from);
      const to = nodeById.get(edge.to);
      if (!from || !to) continue;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.hypot(dx, dy) || 1;
      const target = edge.label === "supports" ? 98 : 132;
      const force = (distance - target) * 0.006;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;
      from.vx += fx;
      from.vy += fy;
      to.vx -= fx;
      to.vy -= fy;
    }

    for (const node of layoutNodes) {
      node.vx += (centerX - node.x) * 0.002;
      node.vy += (centerY - node.y) * 0.002;
      node.x = Math.min(width - 52, Math.max(52, node.x + node.vx));
      node.y = Math.min(height - 36, Math.max(36, node.y + node.vy));
      node.vx *= 0.72;
      node.vy *= 0.72;
    }
  }

  return layoutNodes;
}

export function KnowledgeGraph({ nodes, edges }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<LayoutNode | null>(null);
  const layoutRef = useRef<LayoutNode[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(280, Math.floor(rect.height));
    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const layoutNodes = buildLayout(nodes, edges, width, height);
    layoutRef.current = layoutNodes;
    const nodeById = new Map(layoutNodes.map((node) => [node.id, node]));

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#f7fbf8";
    context.fillRect(0, 0, width, height);

    for (const edge of edges) {
      const from = nodeById.get(edge.from);
      const to = nodeById.get(edge.to);
      if (!from || !to) continue;
      context.beginPath();
      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);
      context.strokeStyle = edgeColors[edge.label] ?? "#aabbb4";
      context.lineWidth = edge.label === "supports" ? 1 : 1.7;
      context.globalAlpha = edge.label === "supports" ? 0.46 : 0.72;
      if (edge.label === "prereq") context.setLineDash([7, 7]);
      context.stroke();
      context.setLineDash([]);
    }

    context.globalAlpha = 1;
    for (const node of layoutNodes) {
      const radius = nodeRadius[node.kind];
      context.beginPath();
      context.arc(node.x, node.y, radius, 0, Math.PI * 2);
      context.fillStyle = nodeColors[node.kind];
      context.fill();
      context.lineWidth = node.kind === "resource" ? 1.5 : 3;
      context.strokeStyle = "#ffffff";
      context.stroke();

      if (node.kind === "course") {
        context.fillStyle = "#ffffff";
        context.font = "800 10px Inter, system-ui, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(shortLabel(node.label, 8), node.x, node.y);
      }
    }
  }, [edges, nodes]);

  function handlePointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const hit = layoutRef.current.findLast((node) => Math.hypot(node.x - x, node.y - y) <= nodeRadius[node.kind] + 5);
    setHoveredNode(hit ?? null);
  }

  return (
    <section className="panel graph-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Knowledge graph</p>
          <h2>KTU subjects, concepts, resources</h2>
        </div>
        <span>Canvas graph</span>
      </div>

      <div className="graph-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="graph-canvas"
          aria-label="CogniGraph KTU academic knowledge graph"
          onPointerLeave={() => setHoveredNode(null)}
          onPointerMove={handlePointerMove}
        />
        {hoveredNode ? (
          <div className={`graph-tooltip ${hoveredNode.kind}`}>
            <strong>{hoveredNode.label}</strong>
            <span>{hoveredNode.kind}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
