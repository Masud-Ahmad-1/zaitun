"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useZaitunStore, type Person, type Relationship } from "@/store/zaitun";
import { User, ArrowRight } from "lucide-react";

type TreeNode = {
  id: string;
  person: Person;
  x: number;
  y: number;
  children: TreeNode[];
  spouse?: TreeNode;
};

function buildHierarchy(persons: Person[], rels: Relationship[]): TreeNode[] {
  const pMap = new Map(persons.map((p) => [p.id, p]));
  const childOf = new Map<string, string[]>();

  for (const r of rels) {
    if (r.type === "father" || r.type === "mother" || r.type === "parent") {
      if (!childOf.has(r.person1Id)) childOf.set(r.person1Id, []);
      if (!childOf.get(r.person1Id)!.includes(r.person2Id)) childOf.get(r.person1Id)!.push(r.person2Id);
    }
  }

  const spouseOf = new Map<string, string>();
  for (const r of rels) {
    if (r.type === "spouse") {
      spouseOf.set(r.person1Id, r.person2Id);
      spouseOf.set(r.person2Id, r.person1Id);
    }
  }

  const childrenOf = new Set<string>();
  childOf.forEach((children) => children.forEach((c) => childrenOf.add(c)));

  const hasSpouse = new Set<string>();
  spouseOf.forEach((_, k) => hasSpouse.add(k));

  const isRoot = (id: string) => !childrenOf.has(id) || hasSpouse.has(id);

  const roots = persons.filter((p) => isRoot(p.id) && !spouseOf.has(p.id) || (isRoot(p.id) && (spouseOf.get(p.id) === undefined || persons.findIndex(x => x.id === p.id) < persons.findIndex(x => x.id === spouseOf.get(p.id)!))));

  const visited = new Set<string>();
  const result: TreeNode[] = [];

  function makeNode(pid: string): TreeNode | null {
    if (visited.has(pid)) return null;
    visited.add(pid);
    const person = pMap.get(pid);
    if (!person) return null;
    const spouseId = spouseOf.get(pid);
    let spouse: TreeNode | undefined;
    if (spouseId && !visited.has(spouseId)) {
      visited.add(spouseId);
      const sp = pMap.get(spouseId);
      if (sp) spouse = { id: sp.id, person: sp, x: 0, y: 0, children: [] };
    }
    const kids = childOf.get(pid) || [];
    const children: TreeNode[] = [];
    for (const kid of kids) {
      const n = makeNode(kid);
      if (n) children.push(n);
    }
    return { id: pid, person, x: 0, y: 0, children, spouse };
  }

  for (const p of roots) {
    if (visited.has(p.id)) continue;
    const node = makeNode(p.id);
    if (node) result.push(node);
  }

  // Also add orphans
  for (const p of persons) {
    if (!visited.has(p.id)) {
      visited.add(p.id);
      result.push({ id: p.id, person: p, x: 0, y: 0, children: [] });
    }
  }

  return result;
}

const NODE_W = 140;
const NODE_H = 64;
const H_GAP = 30;
const V_GAP = 80;
const SPOUSE_GAP = 10;

function layoutTree(nodes: TreeNode[], depth: number, startX: number): number {
  let curX = startX;
  for (const node of nodes) {
    if (node.children.length > 0) {
      curX = layoutTree(node.children, depth + 1, curX);
      const firstChild = node.children[0];
      const lastChild = node.children[node.children.length - 1];
      node.x = (firstChild.x + lastChild.x) / 2;
    } else {
      node.x = curX;
      curX += NODE_W + H_GAP;
    }
    node.y = depth * (NODE_H + V_GAP);
    if (node.spouse) {
      node.spouse.x = node.x + NODE_W + SPOUSE_GAP;
      node.spouse.y = node.y;
      curX = Math.max(curX, node.spouse.x + NODE_W + H_GAP);
    }
  }
  return curX;
}

const GENDER_COLORS: Record<string, string> = {
  male: "bg-sky-50 border-sky-200 text-sky-900",
  female: "bg-rose-50 border-rose-200 text-rose-900",
  other: "bg-violet-50 border-violet-200 text-violet-900",
};

function getGenderColor(person: Person): string {
  return GENDER_COLORS[person.gender || ""] || "bg-emerald-50 border-emerald-200 text-emerald-900";
}

const REL_LABELS: Record<string, string> = {
  father: "→", mother: "→", spouse: "♥", child: "→", parent: "→",
  son: "→", daughter: "→", brother: "≈", sister: "≈", sibling: "≈",
  grandfather: "→", grandmother: "→", grandson: "→", granddaughter: "→",
  uncle: "→", aunt: "→", cousin: "≈", other: "→",
};

export function TreeCanvas() {
  const { persons, relationships, setEditingPerson, locale } = useZaitunStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<TreeNode[]>([]);
  const dragRef = useRef<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);

  const hierarchy = useMemo(() => buildHierarchy(persons, relationships), [persons, relationships]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (hierarchy.length === 0) return;
    const nodes = hierarchy;
    layoutTree(nodes, 0, 40);
    nodesRef.current = nodes;

    const allNodes: TreeNode[] = [];
    function collect(n: TreeNode) { allNodes.push(n); n.children.forEach(collect); if (n.spouse) allNodes.push(n.spouse); }
    nodes.forEach(collect);

    // Auto-fit
    let maxX = 0, maxY = 0;
    for (const n of allNodes) {
      const nx = n.spouse ? n.x : n.x + NODE_W;
      maxX = Math.max(maxX, nx);
      maxY = Math.max(maxY, n.y + NODE_H);
    }
    const pad = 40;
    const sx = Math.min(1, (rect.width - pad * 2) / Math.max(1, maxX + pad));
    const sy = Math.min(1, (rect.height - pad * 2) / Math.max(1, maxY + pad));
    const scale = Math.min(sx, sy, 1.2);
    const ox = (rect.width - (maxX + pad) * scale) / 2;
    const oy = pad;

    // Draw connections
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "#a7c4b5";

    for (const node of nodes) {
      const nx = node.x * scale + ox;
      const ny = node.y * scale + oy;
      const nw = NODE_W * scale;
      const nh = NODE_H * scale;

      // Parent → child lines
      for (const child of node.children) {
        const cx = child.x * scale + ox;
        const cy = child.y * scale + oy;
        const cw = NODE_W * scale;
        ctx.beginPath();
        ctx.moveTo(nx + nw / 2, ny + nh);
        const midY = (ny + nh + cy) / 2;
        ctx.bezierCurveTo(nx + nw / 2, midY, cx + cw / 2, midY, cx + cw / 2, cy);
        ctx.stroke();
      }

      // Spouse connector
      if (node.spouse) {
        const sx2 = node.spouse.x * scale + ox;
        const sy2 = node.spouse.y * scale + oy;
        ctx.strokeStyle = "#e8a0a0";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(nx + nw + 2, ny + nh / 2);
        ctx.lineTo(sx2 - 2, sy2 + nh / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.strokeStyle = "#a7c4b5";
        ctx.lineWidth = 1.5;

        // Heart
        ctx.font = `${14 * scale}px serif`;
        ctx.fillStyle = "#e8a0a0";
        ctx.textAlign = "center";
        ctx.fillText("♥", (nx + nw + sx2) / 2, ny + nh / 2 + 5 * scale);
      }
    }

    // Draw nodes
    for (const node of allNodes) {
      const nx = node.x * scale + ox;
      const ny = node.y * scale + oy;
      const nw = NODE_W * scale;
      const nh = NODE_H * scale;

      // Card
      ctx.fillStyle = node.person.isDeceased ? "#f5f5f5" : "#fffef9";
      ctx.strokeStyle = node.person.isDeceased ? "#d4d4d4" : "#86efac";
      ctx.lineWidth = 1.5;
      roundRect(ctx, nx, ny, nw, nh, 10 * scale);
      ctx.fill();
      ctx.stroke();

      // Gender indicator
      const gColor = node.person.gender === "male" ? "#7dd3fc" : node.person.gender === "female" ? "#fda4af" : "#c4b5fd";
      ctx.fillStyle = gColor;
      ctx.beginPath();
      ctx.arc(nx + 14 * scale, ny + 18 * scale, 4 * scale, 0, Math.PI * 2);
      ctx.fill();

      // Name
      ctx.fillStyle = node.person.isDeceased ? "#a3a3a3" : "#14532d";
      ctx.font = `bold ${13 * scale}px "Geist", sans-serif`;
      ctx.textAlign = "center";
      const displayName = node.person.lastName
        ? `${node.person.firstName} ${node.person.lastName}`
        : node.person.firstName;
      ctx.fillText(displayName.length > 16 ? displayName.slice(0, 15) + "…" : displayName, nx + nw / 2, ny + 22 * scale);

      // Details
      ctx.fillStyle = "#6b7280";
      ctx.font = `${10 * scale}px "Geist", sans-serif`;
      const details: string[] = [];
      if (node.person.occupation) details.push(node.person.occupation);
      if (node.person.birthDate) details.push(node.person.birthDate);
      if (node.person.isDeceased) details.push("✝");
      ctx.fillText(details.slice(0, 2).join(" · "), nx + nw / 2, ny + 42 * scale);

      if (node.person.isDeceased) {
        ctx.strokeStyle = "#d4d4d4";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nx + 8 * scale, ny + nh - 8 * scale);
        ctx.lineTo(nx + nw - 8 * scale, ny + nh - 8 * scale);
        ctx.stroke();
      }
    }
  }, [hierarchy]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const allNodes: TreeNode[] = [];
    function collect(n: TreeNode) { allNodes.push(n); n.children.forEach(collect); if (n.spouse) allNodes.push(n.spouse); }
    nodesRef.current.forEach(collect);

    for (const node of allNodes) {
      if (x >= node.x && x <= node.x + NODE_W && y >= node.y && y <= node.y + NODE_H) {
        setEditingPerson(node.person);
        return;
      }
    }
  };

  if (persons.length === 0) return null;

  return (
    <div ref={containerRef} className="w-full h-[500px] md:h-[600px] relative rounded-xl border border-emerald-100 bg-white/50 overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="w-full h-full cursor-pointer"
      />
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}