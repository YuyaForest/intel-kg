import { KGData, NormalizedNode, RawKGEdge } from "../types";
import kgJsonData from "../data/consolidated_kg.json";

export function loadAndNormalizeKG(): {
  nodes: NormalizedNode[];
  edges: RawKGEdge[];
  nodeMap: Map<string, NormalizedNode>;
  nodeTypes: string[];
} {
  const data = kgJsonData as unknown as KGData;
  const nodes: NormalizedNode[] = [];
  const nodeMap = new Map<string, NormalizedNode>();
  const typeSet = new Set<string>();

  for (const rawNode of data.nodes) {
    const id = rawNode.properties.id || rawNode.properties.name || "unknown";
    const name = rawNode.properties.name || rawNode.properties.id || id;
    const label = rawNode.label || "Entity";

    typeSet.add(label);

    const normNode: NormalizedNode = {
      id,
      label,
      name,
      properties: rawNode.properties,
    };

    if (!nodeMap.has(id)) {
      nodes.push(normNode);
      nodeMap.set(id, normNode);
    }
  }

  // Filter edges to ensure both source and target exist
  const validEdges = data.edges.filter((e) => {
    return nodeMap.has(e.from) && nodeMap.has(e.to);
  });

  return {
    nodes,
    edges: validEdges,
    nodeMap,
    nodeTypes: Array.from(typeSet).sort(),
  };
}

export function getNodeColor(type: string): string {
  switch (type) {
    case "ThreatActor":
      return "#ef4444"; // Red
    case "Vulnerability":
      return "#f97316"; // Orange
    case "Malware":
      return "#3b82f6"; // Blue
    case "MitreTechnique":
      return "#10b981"; // Emerald
    case "Industry":
      return "#a855f7"; // Purple
    case "Region":
      return "#14b8a6"; // Teal
    default:
      return "#6b7280"; // Gray
  }
}

export function getNodeBadgeStyle(type: string): string {
  switch (type) {
    case "ThreatActor":
      return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
    case "Vulnerability":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
    case "Malware":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
    case "MitreTechnique":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    case "Industry":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30";
    case "Region":
      return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30";
    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30";
  }
}
