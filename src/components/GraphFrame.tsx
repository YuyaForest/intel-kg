import React, { useEffect, useRef, useState, useMemo } from "react";
import cytoscape, { Core } from "cytoscape";
import {
  Search,
  Filter,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  MessageSquare,
  Shield,
  Bug,
  Crosshair,
  Globe,
  Building2,
  Layers,
  Info,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { NormalizedNode, RawKGEdge } from "../types";
import { getNodeColor, getNodeBadgeStyle } from "../lib/kgUtils";

interface GraphFrameProps {
  nodes: NormalizedNode[];
  edges: RawKGEdge[];
  nodeTypes: string[];
  selectedNode: NormalizedNode | null;
  onSelectNode: (node: NormalizedNode | null) => void;
  onAskGeminiAboutNode: (node: NormalizedNode) => void;
}

export const GraphFrame: React.FC<GraphFrameProps> = ({
  nodes,
  edges,
  nodeTypes,
  selectedNode,
  onSelectNode,
  onAskGeminiAboutNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [layoutName, setLayoutName] = useState<string>("cose");
  const [showDrawer, setShowDrawer] = useState<boolean>(true);

  // Filtered node IDs set for fast lookup
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      // Type match
      if (selectedType !== "ALL" && n.label !== selectedType) {
        return false;
      }
      // Search query match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = n.name.toLowerCase().includes(q);
        const matchId = n.id.toLowerCase().includes(q);
        const matchType = n.label.toLowerCase().includes(q);
        const matchProps = JSON.stringify(n.properties).toLowerCase().includes(q);
        return matchName || matchId || matchType || matchProps;
      }
      return true;
    });
  }, [nodes, selectedType, searchQuery]);

  // Convert normalized nodes & edges into Cytoscape elements
  const cyElements = useMemo(() => {
    const validNodeIds = new Set(filteredNodes.map((n) => n.id));

    const cyNodes = filteredNodes.map((n) => {
      const color = getNodeColor(n.label);
      return {
        data: {
          id: n.id,
          label: n.name,
          fullType: n.label,
          color: color,
          nodeData: n,
        },
      };
    });

    const cyEdges = edges
      .filter((e) => validNodeIds.has(e.from) && validNodeIds.has(e.to))
      .map((e, idx) => ({
        data: {
          id: `edge-${idx}-${e.from}-${e.to}`,
          source: e.from,
          target: e.to,
          label: e.label,
        },
      }));

    return [...cyNodes, ...cyEdges];
  }, [filteredNodes, edges]);

  // Initialize and update Cytoscape instance
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: cyElements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "background-color": "data(color)",
            color: "#e2e8f0",
            "font-size": "11px",
            "font-weight": "bold",
            "text-valign": "bottom",
            "text-halign": "center",
            "text-margin-y": 5,
            "text-background-opacity": 0.8,
            "text-background-color": "#0f172a",
            "text-background-padding": "3px",
            "text-background-shape": "roundrectangle",
            width: 32,
            height: 32,
            "border-width": 2,
            "border-color": "#ffffff",
            "border-opacity": 0.8,
            "transition-property": "background-color, border-color, width, height",
            "transition-duration": 0.2,
          },
        },
        {
          selector: 'node[fullType="ThreatActor"]',
          style: {
            shape: "ellipse",
            width: 38,
            height: 38,
          },
        },
        {
          selector: 'node[fullType="Vulnerability"]',
          style: {
            shape: "diamond",
            width: 36,
            height: 36,
          },
        },
        {
          selector: 'node[fullType="Malware"]',
          style: {
            shape: "pentagon",
            width: 34,
            height: 34,
          },
        },
        {
          selector: "edge",
          style: {
            width: 1.8,
            "line-color": "#475569",
            "target-arrow-color": "#64748b",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(label)",
            "font-size": "9px",
            color: "#94a3b8",
            "text-rotation": "autorotate",
            "text-margin-y": -6,
            "text-background-opacity": 0.7,
            "text-background-color": "#0f172a",
            "text-background-padding": "2px",
            "opacity": 0.75,
          },
        },
        {
          selector: "node.highlighted",
          style: {
            "border-width": 4,
            "border-color": "#818cf8",
            width: 44,
            height: 44,
            "font-size": "13px",
            "text-background-opacity": 1,
            "z-index": 999,
          },
        },
        {
          selector: "edge.highlighted",
          style: {
            width: 3,
            "line-color": "#818cf8",
            "target-arrow-color": "#818cf8",
            color: "#818cf8",
            opacity: 1,
            "z-index": 998,
          },
        },
        {
          selector: ".dimmed",
          style: {
            opacity: 0.15,
            "text-opacity": 0.15,
          },
        },
      ],
      layout: getLayoutConfig(layoutName),
    });

    cyRef.current = cy;

    // Tap node handler
    cy.on("tap", "node", (evt) => {
      const nodeObj: NormalizedNode = evt.target.data("nodeData");
      onSelectNode(nodeObj);
      setShowDrawer(true);

      // Highlight connections
      const targetNode = evt.target;
      const connectedEdges = targetNode.connectedEdges();
      const connectedNodes = connectedEdges.connectedNodes();

      cy.batch(() => {
        cy.elements().removeClass("highlighted dimmed");
        cy.elements().difference(connectedNodes.union(connectedEdges)).addClass("dimmed");
        targetNode.addClass("highlighted");
        connectedNodes.addClass("highlighted");
        connectedEdges.addClass("highlighted");
      });
    });

    // Tap background handler
    cy.on("tap", (evt) => {
      if (evt.target === cy) {
        onSelectNode(null);
        cy.batch(() => {
          cy.elements().removeClass("highlighted dimmed");
        });
      }
    });

    // Resize observer to fit graph container
    const resizeObserver = new ResizeObserver(() => {
      if (cyRef.current) {
        cyRef.current.resize();
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      cy.destroy();
      cyRef.current = null;
    };
  }, [cyElements, layoutName]);

  // Layout runner configuration
  function getLayoutConfig(name: string) {
    switch (name) {
      case "circle":
        return { name: "circle", padding: 40 };
      case "grid":
        return { name: "grid", padding: 40 };
      case "concentric":
        return { name: "concentric", minNodeSpacing: 35, padding: 40 };
      case "breadthfirst":
        return { name: "breadthfirst", directed: true, padding: 40 };
      case "cose":
      default:
        return {
          name: "cose",
          idealEdgeLength: 100,
          nodeOverlap: 25,
          refresh: 20,
          fit: true,
          padding: 40,
          randomize: false,
          componentSpacing: 100,
          nodeRepulsion: 400000,
          edgeElasticity: 100,
          nestingFactor: 5,
          gravity: 80,
          numIter: 800,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0,
        };
    }
  }

  // Handle re-running layout manually
  const handleRedoLayout = () => {
    if (cyRef.current) {
      cyRef.current.layout(getLayoutConfig(layoutName)).run();
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.25);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 30);
    }
  };

  const handleResetHighlights = () => {
    if (cyRef.current) {
      cyRef.current.elements().removeClass("highlighted dimmed");
      onSelectNode(null);
    }
  };

  // Find connected edges for selected node
  const connectedEdgesForSelected = useMemo(() => {
    if (!selectedNode) return [];
    return edges.filter((e) => e.from === selectedNode.id || e.to === selectedNode.id);
  }, [selectedNode, edges]);

  // Icon helper per node type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case "ThreatActor":
        return <Shield className="w-4 h-4 text-red-500" />;
      case "Vulnerability":
        return <Bug className="w-4 h-4 text-orange-500" />;
      case "Malware":
        return <Shield className="w-4 h-4 text-blue-500" />;
      case "MitreTechnique":
        return <Crosshair className="w-4 h-4 text-emerald-500" />;
      case "Industry":
        return <Building2 className="w-4 h-4 text-purple-500" />;
      case "Region":
        return <Globe className="w-4 h-4 text-teal-500" />;
      default:
        return <Layers className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative w-full h-full bg-[#050505] flex flex-col overflow-hidden select-none">
      {/* Top Filter & Toolbar */}
      <div className="p-3 bg-[#0d0d0d] border-b border-white/10 flex flex-col gap-2.5 z-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search threat actors, malware, CVEs, techniques..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#151515] text-slate-100 border border-white/10 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder-white/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-white/40 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Layout & Control Buttons */}
          <div className="flex items-center gap-2">
            <select
              value={layoutName}
              onChange={(e) => {
                setLayoutName(e.target.value);
              }}
              className="bg-[#151515] text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              <option value="cose">Force-Directed (COSE)</option>
              <option value="concentric">Concentric</option>
              <option value="circle">Circular</option>
              <option value="breadthfirst">Hierarchy</option>
              <option value="grid">Grid</option>
            </select>

            <button
              onClick={handleRedoLayout}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-colors"
              title="Redo Layout"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleZoomIn}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleZoomOut}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleFit}
              className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-colors"
              title="Fit View"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetHighlights}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-lg border border-white/10 transition-colors"
              title="Reset Selection & Highlights"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Node Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-[11px] font-medium text-white/40 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Filter:
          </span>
          <button
            onClick={() => setSelectedType("ALL")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
              selectedType === "ALL"
                ? "bg-indigo-600 text-white border-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                : "bg-white/5 text-white/60 border-white/10 hover:text-white"
            }`}
          >
            All ({nodes.length})
          </button>

          {nodeTypes.map((type) => {
            const count = nodes.filter((n) => n.label === type).length;
            const color = getNodeColor(type);
            const isSelected = selectedType === type;

            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-indigo-950/80 text-white border-indigo-500/80 ring-1 ring-indigo-500/50"
                    : "bg-white/5 text-white/60 border-white/10 hover:text-white"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {type}
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Cytoscape Canvas */}
      <div className="flex-1 w-full h-full relative">
        <div ref={containerRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />

        {/* Watermark / Helper instruction overlay if no node selected */}
        {!selectedNode && (
          <div className="absolute bottom-4 left-4 p-3 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[10px] space-y-1.5 text-white/70 max-w-xs pointer-events-none">
            <div className="flex items-center gap-1.5 text-white font-semibold">
              <Info className="w-3.5 h-3.5 text-indigo-400" />
              Knowledge Graph Interactive
            </div>
            Click any threat entity node to inspect properties & highlight connected subgraphs.
          </div>
        )}
      </div>

      {/* Selected Node Details Drawer / Inspector */}
      {selectedNode && showDrawer && (
        <div className="absolute bottom-4 left-4 right-4 max-w-xl mx-auto bg-[#0d0d0d]/95 border border-white/10 rounded-xl shadow-2xl backdrop-blur-md p-4 z-20 text-slate-200 transition-all max-h-72 overflow-y-auto">
          <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-2.5 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                {getTypeIcon(selectedNode.label)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">{selectedNode.name}</h3>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getNodeBadgeStyle(
                      selectedNode.label
                    )}`}
                  >
                    {selectedNode.label}
                  </span>
                </div>
                {selectedNode.id !== selectedNode.name && (
                  <span className="text-xs text-white/40 font-mono">ID: {selectedNode.id}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => onAskGeminiAboutNode(selectedNode)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)] transition-all cursor-pointer active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Geminiで解説
              </button>
              <button
                onClick={() => setShowDrawer(false)}
                className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Properties Table */}
          <div className="space-y-2 text-xs">
            {Object.entries(selectedNode.properties).map(([key, val]) => {
              if (!val || key === "id" || key === "name") return null;
              return (
                <div key={key} className="grid grid-cols-3 gap-2 bg-[#050505]/80 p-2 rounded-lg border border-white/5">
                  <span className="font-mono text-white/40 uppercase tracking-wider text-[10px] self-start mt-0.5">
                    {key.replace(/_/g, " ")}:
                  </span>
                  <span className="col-span-2 text-slate-200 font-sans leading-relaxed break-words">
                    {String(val)}
                  </span>
                </div>
              );
            })}

            {/* Connected Relations */}
            {connectedEdgesForSelected.length > 0 && (
              <div className="mt-3 pt-2 border-t border-white/10">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-1.5">
                  Connected Threat Relationships ({connectedEdgesForSelected.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {connectedEdgesForSelected.map((edge, idx) => {
                    const isSource = edge.from === selectedNode.id;
                    const otherNodeId = isSource ? edge.to : edge.from;
                    return (
                      <div
                        key={idx}
                        className="inline-flex items-center gap-1 bg-white/5 px-2 py-1 rounded text-[11px] border border-white/10 text-slate-300"
                      >
                        <span className="text-indigo-400 font-semibold">{isSource ? "→" : "←"}</span>
                        <span className="text-white/40 font-mono text-[10px]">{edge.label}:</span>
                        <span className="font-medium text-slate-200">{otherNodeId}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
