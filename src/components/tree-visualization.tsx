'use client';

import { useMemo } from 'react';
import { useAppStore, type Person, type Relationship } from '@/lib/store';

interface TreeNode {
  person: Person;
  x: number;
  y: number;
  generation: number;
}

interface LayoutResult {
  nodes: TreeNode[];
 edges: { from: TreeNode; to: TreeNode; type: string }[];
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 70;
 const H_GAP = 40;
 const V_GAP = 100;
 const PADDING = 40;

function buildTreeLayout(persons: Person[], relationships: Relationship[], locale: string): LayoutResult {
  if (persons.length === 0) return { nodes: [], edges: [] };

  const personMap = new Map<string, Person>();
  persons.forEach((p) => personMap.set(p.id, p));

  // Build adjacency: parent -> children, spouse pairs
  const childrenOf = new Map<string, string[]>();
  const spouseOf = new Map<string, string>();
  const parentOf = new Map<string, string[]>();
  const siblingOf = new Map<string, Set<string>>();

  relationships.forEach((rel) => {
    if (rel.type === 'father' || rel.type === 'mother') {
 // from is parent, to is child
      if (!childrenOf.has(rel.fromId)) childrenOf.set(rel.fromId, []);
      childrenOf.get(rel.fromId)!.push(rel.toId);
      if (!parentOf.has(rel.toId)) parentOf.set(rel.toId, []);
      parentOf.get(rel.toId)!.push(rel.fromId);
    } else if (rel.type === 'son' || rel.type === 'daughter') {
 // from is child, to is parent
      if (!childrenOf.has(rel.toId)) childrenOf.set(rel.toId, []);
      childrenOf.get(rel.toId)!.push(rel.fromId);
      if (!parentOf.has(rel.fromId)) parentOf.set(rel.fromId, []);
      parentOf.get(rel.fromId)!.push(rel.toId);
    } else if (rel.type === 'spouse') {
      spouseOf.set(rel.fromId, rel.toId);
      spouseOf.set(rel.toId, rel.fromId);
    } else if (rel.type === 'brother' || rel.type === 'sister') {
      if (!siblingOf.has(rel.fromId)) siblingOf.set(rel.fromId, new Set());
      if (!siblingOf.has(rel.toId)) siblingOf.set(rel.toId, new Set());
      siblingOf.get(rel.fromId)!.add(rel.toId);
      siblingOf.get(rel.toId)!.add(rel.fromId);
    }
  });

  // Determine generations using BFS from roots
  const generations = new Map<string, number>();
  const visited = new Set<string>();

  // Find roots (people with no parents)
  let roots: string[] = [];
  for (const p of persons) {
    if (!parentOf.has(p.id) || parentOf.get(p.id)!.length === 0) {
      roots.push(p.id);
    }
  }

  // If no clear roots, use the first person
  if (roots.length === 0) {
    roots = [persons[0].id];
  }

  // BFS to assign generations
  const queue: { id: string; gen: number }[] = roots.map((id) => ({ id, gen: 0 }));
  roots.forEach((id) => visited.add(id));

  while (queue.length > 0) {
    const { id, gen } = queue.shift()!;
    generations.set(id, gen);

    // Process children
    const children = childrenOf.get(id) || [];
    for (const childId of children) {
      const existingGen = generations.get(childId);
      const newGen = gen + 1;
      if (existingGen === undefined || existingGen < newGen) {
        generations.set(childId, newGen);
        if (!visited.has(childId)) {
          visited.add(childId);
          queue.push({ id: childId, gen: newGen });
        }
      }
    }

    // Process spouses - same generation
    const spouseId = spouseOf.get(id);
    if (spouseId && !visited.has(spouseId)) {
      visited.add(spouseId);
      queue.push({ id: spouseId, gen });
    }

    // Process siblings - same generation
    const siblings = siblingOf.get(id);
    if (siblings) {
      for (const sibId of siblings) {
        if (!visited.has(sibId)) {
          visited.add(sibId);
          queue.push({ id: sibId, gen });
        }
      }
    }
  }

  // Assign unvisited people to generation 0
  for (const p of persons) {
    if (!generations.has(p.id)) {
      generations.set(p.id, 0);
    }
  }

  // Group by generation
  const genGroups = new Map<number, string[]>();
  for (const [id, gen] of generations) {
    if (!genGroups.has(gen)) genGroups.set(gen, []);
    genGroups.get(gen)!.push(id);
  }

  // Sort generations
  const sortedGens = Array.from(genGroups.keys()).sort((a, b) => a - b);

  // Build nodes with positions - track spouse pairs to place them together
  const nodes: TreeNode[] = [];
 const nodeMap = new Map<string, TreeNode>();
  const placedSpouses = new Set<string>();

  for (const gen of sortedGens) {
    const idsInGen = genGroups.get(gen)!;
    let x = PADDING;
    const y = PADDING + gen * (NODE_HEIGHT + V_GAP);

    for (const id of idsInGen) {
      if (placedSpouses.has(id)) continue;

      const person = personMap.get(id)!;
      nodes.push({ person, x, y, generation: gen });
      nodeMap.set(id, { person, x, y, generation: gen });
      x += NODE_WIDTH + H_GAP;

      // Place spouse right next to this person
      const spouseId = spouseOf.get(id);
      if (spouseId && idsInGen.includes(spouseId) && !placedSpouses.has(spouseId)) {
        const spouse = personMap.get(spouseId)!;
        nodes.push({ person: spouse, x, y, generation: gen });
        nodeMap.set(spouseId, { person: spouse, x, y, generation: gen });
        placedSpouses.add(spouseId);
        x += NODE_WIDTH + H_GAP;
      }
    }
  }

  // Center each generation horizontally
  const genWidths = new Map<number, { minX: number; maxX: number; ids: string[] }>();
  for (const node of nodes) {
    if (!genWidths.has(node.generation)) {
      genWidths.set(node.generation, { minX: node.x, maxX: node.x + NODE_WIDTH, ids: [] });
    }
    const g = genWidths.get(node.generation)!;
    g.minX = Math.min(g.minX, node.x);
    g.maxX = Math.max(g.maxX, node.x + NODE_WIDTH);
    g.ids.push(node.person.id);
  }

  let maxGenWidth = 0;
  for (const [, g] of genWidths) {
    maxGenWidth = Math.max(maxGenWidth, g.maxX - g.minX);
  }

  for (const node of nodes) {
    const g = genWidths.get(node.generation)!;
    const genWidth = g.maxX - g.minX;
    const offset = (maxGenWidth - genWidth) / 2;
    node.x += offset;
  }

  // Update nodeMap with centered positions
  for (const node of nodes) {
    nodeMap.set(node.person.id, node);
  }

  // Build edges
  const edges: { from: TreeNode; to: TreeNode; type: string }[] = [];
  for (const rel of relationships) {
    const fromNode = nodeMap.get(rel.fromId);
    const toNode = nodeMap.get(rel.toId);
    if (fromNode && toNode) {
      edges.push({ from: fromNode, to: toNode, type: rel.type });
    }
  }

  return { nodes, edges };
}

function getPersonDisplayName(person: Person, locale: string): string {
  if (locale === 'bn' && person.nameBn) return person.nameBn;
  return person.name;
}

function truncateName(name: string, maxLen: number): string {
  if (name.length <= maxLen) return name;
  return name.slice(0, maxLen - 1) + '…';
}

export function TreeVisualization() {
  const { persons, relationships, locale } = useAppStore();

  const { nodes, edges } = useMemo(
    () => buildTreeLayout(persons, relationships, locale),
    [persons, relationships, locale]
  );

  if (persons.length === 0) {
    return null;
  }

  // Calculate SVG dimensions
  let maxX = 0;
  let maxY = 0;
  for (const node of nodes) {
    maxX = Math.max(maxX, node.x + NODE_WIDTH);
    maxY = Math.max(maxY, node.y + NODE_HEIGHT);
  }
  const svgWidth = maxX + PADDING;
  const svgHeight = maxY + PADDING;

  return (
    <div className="overflow-auto custom-scrollbar border rounded-lg bg-muted/20" style={{ minHeight: 300 }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        className="min-w-full"
        style={{ minWidth: svgWidth }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#a8a29e" />
          </marker>
          <marker id="arrowhead-spouse" markerWidth="0" markerHeight="0" refX="0" refY="0" orient="auto">
            <circle cx="0" cy="0" r="3" fill="#f59e0b" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((edge, idx) => {
          const fromCx = edge.from.x + NODE_WIDTH / 2;
          const fromCy = edge.from.y + NODE_HEIGHT / 2;
          const toCx = edge.to.x + NODE_WIDTH / 2;
          const toCy = edge.to.y + NODE_HEIGHT / 2;

          let fromX = fromCx;
          let fromY = edge.from.y + NODE_HEIGHT;
          let toX = toCx;
          let toY = edge.to.y;
          let midY = (fromY + toY) / 2;
          let stroke = '#a8a29e';
          let strokeWidth = 1.5;
          let markerEnd = 'url(#arrowhead)';
          let d = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

          if (edge.type === 'spouse') {
            const leftX = Math.min(edge.from.x, edge.to.x) + NODE_WIDTH;
            const rightX = Math.max(edge.from.x, edge.to.x);
            const sy = edge.from.y + NODE_HEIGHT / 2;
            d = `M ${leftX} ${sy} L ${rightX} ${sy}`;
            stroke = '#f59e0b';
            strokeWidth = 2;
            markerEnd = 'url(#arrowhead-spouse)';
          } else if (edge.type === 'brother' || edge.type === 'sister') {
            fromX = edge.from.x + NODE_WIDTH;
            fromY = edge.from.y + NODE_HEIGHT / 2;
            toX = edge.to.x;
            toY = edge.to.y + NODE_HEIGHT / 2;
            midY = fromY + 20;
            d = `M ${fromX} ${fromY} C ${fromX + 30} ${fromY}, ${toX - 30} ${toY}, ${toX} ${toY}`;
            stroke = '#78716c';
            strokeWidth = 1.5;
            markerEnd = '';
          }

          return (
            <path
              key={`edge-${idx}`}
              d={d}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
              markerEnd={markerEnd}
              opacity={0.7}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const displayName = truncateName(getPersonDisplayName(node.person, locale), 18);
          const isMale = node.person.gender === 'male';
          const bgColor = isMale ? '#ecfdf5' : '#fefce8';
          const borderColor = isMale ? '#059669' : '#d97706';
          const textColor = isMale ? '#065f46' : '#92400e';

          return (
            <g key={node.person.id}>
              <rect
                x={node.x}
                y={node.y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={10}
                ry={10}
                fill={bgColor}
                stroke={borderColor}
                strokeWidth={2}
              />
              <text
                x={node.x + NODE_WIDTH / 2}
                y={node.y + NODE_HEIGHT / 2 - 4}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={textColor}
                fontSize={13}
                fontWeight="600"
                fontFamily="inherit"
              >
                {displayName}
              </text>
              {node.person.birthDate && (
                <text
                  x={node.x + NODE_WIDTH / 2}
                  y={node.y + NODE_HEIGHT / 2 + 16}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={textColor}
                  fontSize={10}
                  opacity={0.7}
                  fontFamily="inherit"
                >
                  {node.person.birthDate.slice(0, 4)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
