import React, { useState, useMemo, useEffect } from "react";
import { Header } from "./components/Header";
import { GraphFrame } from "./components/GraphFrame";
import { ChatFrame } from "./components/ChatFrame";
import { loadAndNormalizeKG } from "./lib/kgUtils";
import { ChatMessage, NormalizedNode } from "./types";

export default function App() {
  const [viewMode, setViewMode] = useState<"split" | "graph" | "chat">("split");
  const [selectedNode, setSelectedNode] = useState<NormalizedNode | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load and normalize Knowledge Graph Data
  const { nodes, edges, nodeTypes } = useMemo(() => {
    return loadAndNormalizeKG();
  }, []);

  // Quick summary string of KG
  const graphSummary = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    for (const n of nodes) {
      typeCounts[n.label] = (typeCounts[n.label] || 0) + 1;
    }
    const countsStr = Object.entries(typeCounts)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    return `Total Nodes: ${nodes.length}, Total Edges: ${edges.length}. Node breakdown: ${countsStr}.`;
  }, [nodes, edges]);

  // Send message handler to Express API /api/chat
  const handleSendMessage = async (text: string, customNode?: NormalizedNode) => {
    const activeNode = customNode || selectedNode;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      selectedNodeContext: activeNode || undefined,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build history payload
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
          selectedNode: activeNode,
          graphSummary,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response from Gemini API");
      }

      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: data.sources || [],
        searchQueries: data.searchQueries || [],
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error("Error asking Gemini:", err);
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        role: "assistant",
        content: `⚠️ エラーが発生しました: ${err.message || "Gemini APIの呼び出しに失敗しました。"}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Ask Gemini about a specific node
  const handleAskGeminiAboutNode = (node: NormalizedNode) => {
    setSelectedNode(node);
    if (viewMode === "graph") setViewMode("split");

    let promptText = `${node.name} (${node.label}) について、Knowledge Graphでの役割、関連する脅威アクタ・マルウェア・攻撃手法、および Google Cloud Threat Intelligence からのグラウンディング情報を交えて詳しく解説してください。`;

    if (node.properties.content) {
      promptText += `\n概要: ${node.properties.content}`;
    }

    handleSendMessage(promptText, node);
  };

  // Ask for complete Graph Overview
  const handleAskOverview = () => {
    if (viewMode === "graph") setViewMode("split");
    const overviewPrompt =
      "Knowledge Graph (consolidated_kg.json) 全体の構造、主要な脅威アクター、マルウェアファミリー、脆弱性 (CVE)、MITRE ATT&CK 手法、および Google Cloud Threat Intelligence の最新知見を要約・解説してください。";
    handleSendMessage(overviewPrompt);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#050505] font-sans text-slate-100 overflow-hidden">
      {/* Header Bar */}
      <Header
        viewMode={viewMode}
        setViewMode={setViewMode}
        onAskOverview={handleAskOverview}
        nodeCount={nodes.length}
        edgeCount={edges.length}
      />

      {/* Main Split Body */}
      <main className="flex-1 w-full h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Frame: Knowledge Graph */}
        <div
          className={`h-full border-r border-white/10 transition-all duration-300 ${
            viewMode === "graph"
              ? "w-full"
              : viewMode === "chat"
              ? "hidden"
              : "w-full md:w-1/2"
          }`}
        >
          <GraphFrame
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            onAskGeminiAboutNode={handleAskGeminiAboutNode}
          />
        </div>

        {/* Right Frame: Gemini AI Chat */}
        <div
          className={`h-full transition-all duration-300 ${
            viewMode === "chat"
              ? "w-full"
              : viewMode === "graph"
              ? "hidden"
              : "w-full md:w-1/2"
          }`}
        >
          <ChatFrame
            messages={messages}
            onSendMessage={(txt) => handleSendMessage(txt)}
            isLoading={isLoading}
            selectedNode={selectedNode}
            onClearNodeContext={() => setSelectedNode(null)}
            onClearHistory={() => setMessages([])}
          />
        </div>
      </main>
    </div>
  );
}
