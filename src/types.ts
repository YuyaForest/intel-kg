export type NodeType =
  | "ThreatActor"
  | "Vulnerability"
  | "Malware"
  | "MitreTechnique"
  | "Industry"
  | "Region"
  | string;

export interface KGNodeProperties {
  id?: string;
  name?: string;
  content?: string;
  type?: string;
  motivation?: string;
  nexus?: string;
  aka?: string;
  focus?: string;
  feature?: string;
  description?: string;
  median_dwell_time?: string;
  internal_detection_rate?: string;
  hand_off_window?: string;
  target_percentage?: string;
  usage_percentage?: string;
  trend?: string;
  rank?: number;
  targets?: string;
  dwell_time?: string;
  [key: string]: any;
}

export interface RawKGNode {
  type: "node";
  label: NodeType;
  properties: KGNodeProperties;
}

export interface RawKGEdge {
  type: "edge";
  label: string;
  from: string;
  to: string;
}

export interface KGData {
  nodes: RawKGNode[];
  edges: RawKGEdge[];
}

export interface NormalizedNode {
  id: string;
  label: NodeType;
  name: string;
  properties: KGNodeProperties;
}

export interface GroundingSource {
  title: string;
  url: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  selectedNodeContext?: NormalizedNode;
  sources?: GroundingSource[];
  searchQueries?: string[];
}
