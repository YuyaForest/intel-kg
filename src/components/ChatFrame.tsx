import React, { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bot,
  User,
  Send,
  Sparkles,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  Globe,
  X,
  AlertCircle,
  Loader2,
  Shield,
  FileText,
} from "lucide-react";
import { ChatMessage, NormalizedNode } from "../types";
import { getNodeBadgeStyle } from "../lib/kgUtils";

interface ChatFrameProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  selectedNode: NormalizedNode | null;
  onClearNodeContext: () => void;
  onClearHistory: () => void;
}

export const ChatFrame: React.FC<ChatFrameProps> = ({
  messages,
  onSendMessage,
  isLoading,
  selectedNode,
  onClearNodeContext,
  onClearHistory,
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText("");
    onSendMessage(text);
  };

  // Handle key down (Enter sends message, Shift+Enter adds newline)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Copy text helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Recommended Quick Prompts
  const quickPrompts = [
    "左フレームのKnowledge Graph全体の概要と注目の脅威アクターをまとめてください。",
    "UNC6201 と BRICKSTORM バックドアによるESXi/vCenter長期潜伏手法を解説してください。",
    "CVE-2025-55182 (React2Shell) や Oracle EBS (CVE-2025-61882) などのゼロデイ脆弱性トレンドと対策を教えてください。",
    "Volt Typhoon や サーバーレスコマンドインジェクション攻撃の特徴と Google Cloud での防衛策は？",
    "DarkSword 及び Coruna iOS エクスプロイトチェーンによるスパイウェア展開の手口について解説してください。",
  ];

  return (
    <div className="w-full h-full bg-[#0d0d0d] flex flex-col overflow-hidden text-slate-100 select-text">
      {/* Right Frame Header */}
      <div className="p-4 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-white">Gemini Intelligence Analyst</h2>
            </div>
            <p className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5 uppercase tracking-wider font-mono">
              <Globe className="w-3 h-3 text-indigo-400" />
              <span>Grounding:</span>
              <a
                href="https://cloud.google.com/blog/topics/threat-intelligence?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                GC Threat Intelligence Blog
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearHistory}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/60 max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.3)]">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base mb-1">
                脅威インテリジェンス AI アシスタント
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Knowledge Graph (195ノード, 182エッジ) の構造情報および Google Cloud Threat Intelligence
                公式レポートからリアルタイムにグラウンディングして解説します。
              </p>
            </div>

            {/* Quick Prompt Cards */}
            <div className="w-full text-left space-y-2 pt-2">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">
                おすすめの質問プロンプト:
              </span>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 hover:text-white transition-all group flex items-start justify-between gap-2 shadow-xs cursor-pointer"
                >
                  <span className="leading-snug">{prompt}</span>
                  <Sparkles className="w-3.5 h-3.5 text-white/30 group-hover:text-indigo-400 shrink-0 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[90%] rounded-xl p-3.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-white/5 border border-white/10 text-white/90 rounded-br-none"
                    : "bg-indigo-500/10 border border-indigo-500/20 text-slate-100 rounded-bl-none"
                }`}
              >
                <div className="text-[10px] font-mono mb-1.5 flex items-center justify-between">
                  <span className={msg.role === "user" ? "text-white/40" : "text-indigo-400 font-bold"}>
                    {msg.role === "user" ? "USER" : "GEMINI ANALYST"}
                  </span>
                  <span className="text-white/30 text-[9px]">{msg.timestamp}</span>
                </div>

                {/* Attached Node Badge if user message had graph context */}
                {msg.selectedNodeContext && (
                  <div className="mb-2.5 p-2 rounded-lg bg-black/40 border border-white/10 flex items-center gap-2 text-[11px]">
                    <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-white/40 font-mono">Graph Entity:</span>
                    <span className="font-bold text-white">{msg.selectedNodeContext.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border ${getNodeBadgeStyle(
                        msg.selectedNodeContext.label
                      )}`}
                    >
                      {msg.selectedNodeContext.label}
                    </span>
                  </div>
                )}

                {/* Message Content with Markdown support */}
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose prose-invert prose-xs max-w-none prose-p:leading-relaxed prose-headings:text-white prose-headings:font-bold prose-a:text-indigo-400 hover:prose-a:underline prose-code:font-mono prose-code:text-indigo-300 prose-code:bg-black/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-black/80 prose-pre:border prose-pre:border-white/10">
                    <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                  </div>
                )}

                {/* Grounding Sources for Assistant Messages */}
                {msg.role === "assistant" && (
                  <div className="mt-3 pt-2 border-t border-indigo-500/20 flex flex-col gap-2">
                    {msg.sources && msg.sources.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest flex items-center gap-1 mb-1">
                          <Globe className="w-3 h-3 text-indigo-400" />
                          Sources (Google Threat Intelligence):
                        </span>
                        <div className="space-y-1">
                          {msg.sources.map((src, idx) => (
                            <a
                              key={idx}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[11px] text-indigo-300 hover:text-indigo-200 hover:underline bg-black/40 px-2.5 py-1 rounded border border-indigo-500/20 max-w-full truncate"
                            >
                              <FileText className="w-3 h-3 text-white/40 shrink-0" />
                              <span className="truncate">{src.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end text-[10px] text-white/40 pt-1">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 text-white/40 hover:text-white transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading Spinner Indicator */}
        {isLoading && (
          <div className="flex gap-3 items-start">
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3.5 text-xs text-indigo-300 flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              <span>Google Threat Intelligence からグラウンディング調査中...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form & Context Banner */}
      <div className="p-4 border-t border-white/10 bg-[#0a0a0a] shrink-0">
        {/* Graph Context Banner */}
        {selectedNode && (
          <div className="mb-2.5 px-3 py-1.5 bg-white/5 border border-indigo-500/40 rounded-lg flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-200 truncate">
              <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-white/40">Context:</span>
              <span className="font-bold text-white truncate">{selectedNode.name}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border ${getNodeBadgeStyle(selectedNode.label)}`}>
                {selectedNode.label}
              </span>
            </div>
            <button
              onClick={onClearNodeContext}
              className="text-white/40 hover:text-white p-0.5 rounded hover:bg-white/10"
              title="Detach Context"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative flex flex-col gap-2">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedNode
                  ? `${selectedNode.name} について質問を入力してください...`
                  : "Ask about threat actors, malware, CVEs, or campaigns..."
              }
              rows={2}
              className="w-full bg-[#151515] border border-white/10 rounded-xl p-3 pr-12 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder-white/20 resize-none h-20"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="absolute bottom-3 right-3 p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white rounded-lg transition-all cursor-pointer shadow-[0_0_10px_rgba(79,70,229,0.4)]"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between px-1 text-[10px] text-white/30 font-mono">
            <div className="flex gap-3">
              <span
                onClick={() => setInputText("")}
                className="hover:text-white/50 cursor-pointer"
              >
                Clear text
              </span>
            </div>
            <div>
              Powered by <span className="text-indigo-400">Gemini 3.1 Flash Lite</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
