import React from "react";
import {
  ShieldAlert,
  Network,
  ExternalLink,
  Bot,
  Columns,
  Maximize2,
  Sparkles,
} from "lucide-react";

interface HeaderProps {
  viewMode: "split" | "graph" | "chat";
  setViewMode: (mode: "split" | "graph" | "chat") => void;
  onAskOverview: () => void;
  nodeCount: number;
  edgeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  setViewMode,
  onAskOverview,
  nodeCount,
  edgeCount,
}) => {
  return (
    <header className="h-16 border-b border-white/10 bg-[#0a0a0a] px-6 flex items-center justify-between z-20 shrink-0 select-none">
      {/* App Branding */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-[0_0_12px_rgba(79,70,229,0.4)]">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-white">
              ThreatKG <span className="text-white/40 font-normal">| Intelligence Explorer</span>
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider font-bold text-green-400">
                Gemini Grounded
              </span>
            </div>
          </div>
          <p className="text-[11px] text-white/40 flex items-center gap-2 mt-0.5">
            <span>
              Source: <code className="text-indigo-400 font-mono">consolidated_kg.json</code>
            </span>
            <span>•</span>
            <a
              href="https://cloud.google.com/blog/topics/threat-intelligence?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-indigo-300 transition-colors underline decoration-indigo-500/30"
            >
              Google Threat Intelligence
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </div>

      {/* Graph Stats & AI Overview CTA */}
      <div className="hidden lg:flex items-center gap-4">
        <div className="flex items-center gap-3 bg-white/5 px-3 py-1 rounded-full border border-white/10 text-[11px] text-white/60 font-mono">
          <div className="flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nodes: <strong className="text-white font-bold">{nodeCount}</strong></span>
          </div>
          <span className="text-white/20">|</span>
          <div className="flex items-center gap-1.5">
            <span>Edges: <strong className="text-white font-bold">{edgeCount}</strong></span>
          </div>
        </div>

        <button
          onClick={onAskOverview}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_12px_rgba(79,70,229,0.3)] transition-all cursor-pointer active:scale-95"
          title="Explain graph summary in Gemini"
        >
          <Sparkles className="w-3.5 h-3.5 text-white/90" />
          全全体要約を解説
        </button>
      </div>

      {/* View Switcher Controls */}
      <div className="flex items-center gap-1 bg-[#121212] p-1 rounded-lg border border-white/10">
        <button
          onClick={() => setViewMode("split")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            viewMode === "split"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
          title="Split View (50/50)"
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">分割表示</span>
        </button>

        <button
          onClick={() => setViewMode("graph")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            viewMode === "graph"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
          title="Focus Graph Frame"
        >
          <Network className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">グラフ全画面</span>
        </button>

        <button
          onClick={() => setViewMode("chat")}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
            viewMode === "chat"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
          title="Focus Gemini Chat Frame"
        >
          <Bot className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">チャット全画面</span>
        </button>
      </div>
    </header>
  );
};
