import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MISSING_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Load KG Data once for server context
let kgDataRaw = "";
try {
  const kgPath = path.join(process.cwd(), "consolidated_kg.json");
  if (fs.existsSync(kgPath)) {
    kgDataRaw = fs.readFileSync(kgPath, "utf-8");
  } else {
    const altKgPath = path.join(process.cwd(), "src", "data", "consolidated_kg.json");
    if (fs.existsSync(altKgPath)) {
      kgDataRaw = fs.readFileSync(altKgPath, "utf-8");
    }
  }
} catch (e) {
  console.error("Failed to load consolidated_kg.json on server:", e);
}

const SYSTEM_INSTRUCTION = `You are a Threat Intelligence AI Analyst assistant.
You specialize in explaining cybersecurity threat intelligence using a Security Knowledge Graph (consolidated_kg.json) and grounding your knowledge in official Google Cloud Threat Intelligence blog reports (https://cloud.google.com/blog/topics/threat-intelligence?hl=en).

Key Guidelines:
1. Always base your explanations on the provided Knowledge Graph context (Threat Actors like UNC6201, UNC3753, UNC6600, Volt Typhoon, Turla, APT44; Malware like BRICKSTORM, DarkSword, Coruna, Darcula; Vulnerabilities like CVEs; MITRE ATT&CK techniques; Industries; and Regions).
2. For all inquiries, perform web grounding (Google Search) specifically searching for and referencing Google Cloud Threat Intelligence (Mandiant / GTIC / Google Threat Intelligence) articles and research when appropriate.
3. When the user provides a selected node or subgraph context from the Knowledge Graph in the left frame, explicitly analyze its connected threat actors, tactics, malware, target regions, and industries.
4. Respond in clear, structured, and professional Japanese (unless requested in another language). Use Markdown formatting (bold, bullet points, headers, code blocks where appropriate).
5. Highlight threat actor nexuses (e.g., China, Russia, North Korea), motivations (Espionage, Cyber Extortion, Financial Fraud), and concrete mitigation advice (MFA, Tier-0 encryption, network segmentation, zero trust) where applicable.`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Route: Get Knowledge Graph Data
  app.get("/api/kg", (_req, res) => {
    try {
      if (kgDataRaw) {
        return res.json(JSON.parse(kgDataRaw));
      }
      const altKgPath = path.join(process.cwd(), "src", "data", "consolidated_kg.json");
      if (fs.existsSync(altKgPath)) {
        const data = fs.readFileSync(altKgPath, "utf-8");
        return res.json(JSON.parse(data));
      }
      res.status(404).json({ error: "consolidated_kg.json not found" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Chat with Gemini using Grounding and Graph context
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history = [], selectedNode, graphSummary } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const ai = getGeminiClient();

      // Build context prompt
      let contextPrompt = "";
      if (selectedNode) {
        contextPrompt += `\n[User Currently Selected Graph Node in Left Frame]:\n${JSON.stringify(selectedNode, null, 2)}\n`;
      }

      if (graphSummary) {
        contextPrompt += `\n[Knowledge Graph Quick Stats / Overview]:\n${graphSummary}\n`;
      }

      // Build contents incorporating message history
      const formattedContents: any[] = [];

      // Add full KG context overview in first turn or prompt
      if (kgDataRaw && history.length === 0) {
        contextPrompt += `\n[Reference Knowledge Graph Source (consolidated_kg.json)]:\nAvailable nodes include ThreatActors (UNC6201, UNC3753, UNC6600, Volt Typhoon, Turla, APT44, ShinyHunters/UNC6240, UNC2814, etc.), Malware (BRICKSTORM, Coruna, DarkSword, Darcula, YY Lai Yu, GRIDTIDE, BLUEBEAM, etc.), Vulnerabilities (CVE-2025-2783, CVE-2025-61882, CVE-2026-35273, CVE-2025-55182, etc.), MITRE ATT&CK techniques, and Target Industries/Regions.\n`;
      }

      for (const msg of history) {
        formattedContents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        });
      }

      const userTextWithContext = contextPrompt
        ? `${contextPrompt}\n[User Question]: ${message}\n\nPlease analyze and explain this query using both the Knowledge Graph data and Google Cloud Threat Intelligence (https://cloud.google.com/blog/topics/threat-intelligence?hl=en) grounding.`
        : message;

      formattedContents.push({
        role: "user",
        parts: [{ text: userTextWithContext }],
      });

      console.log(`Sending request to Gemini with message: "${message.substring(0, 50)}..."`);

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: formattedContents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }],
        },
      });

      const replyText = response.text || "申し訳ありません。回答を生成できませんでした。";

      // Extract grounding metadata chunks if available
      const groundingChunks =
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const searchQueries =
        response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

      const sources = groundingChunks
        .map((chunk: any) => {
          if (chunk.web) {
            return {
              title: chunk.web.title || chunk.web.uri,
              url: chunk.web.uri,
            };
          }
          return null;
        })
        .filter(Boolean);

      return res.json({
        reply: replyText,
        sources,
        searchQueries,
      });
    } catch (err: any) {
      console.error("Error in /api/chat:", err);
      return res.status(500).json({
        error: err.message || "Gemini API request failed.",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
