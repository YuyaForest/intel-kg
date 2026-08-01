# Knowledge Graph of Cyber Angel
搭載した Gemini AI アシスタントを通じてGoogle Cloud Threat Intelligence 等の公式レポートに基づいた分析・解説を提供するセキュリティ分析プラットフォームです。

---

## 🌟 主な機能

1. **インタラクティブなセキュリティナレッジグラフ (Left Frame)**
   - **多様な脅威エンティティ**: 脅威アクター（ThreatActor: UNC6201, Volt Typhoon, Turla, APT44等）、マルウェア（BRICKSTORM, DarkSword, Coruna等）、脆弱性（CVE-2025-2783, CVE-2025-55182等）、MITRE ATT&CK技法、標的業界、リージョンをノードとして可視化。
   - **マルチレイアウト切り替え**: COSE（力学モデル）、Concentric、Circular、Hierarchy、Grid など各種グラフレイアウトの変更対応。
   - **ノード連携強調 (Subgraph Highlight)**: 選択したノードと直接接続された脅威関係（攻撃手法、展開マルウェア、悪用CVE等）を動的にハイライト。
   - **脅威インスペクター**: ノードの属性情報（潜伏期間 Median Dwell Time、攻撃トレンド、Motivation等）を詳細に表示。

2. **Google Search Grounding 搭載 Gemini AI アシスタント (Right Frame)**
   - **モデル**: 高コスパかつ応答速度に優れた `gemini-3.1-flash-lite` を採用。
   - **Google 検索グラウンディング**: [Google Cloud Threat Intelligence Blog](https://cloud.google.com/blog/topics/threat-intelligence?hl=en) を中心とした信頼性の高い最新脅威情報を自動検索し、根拠ソース付きで回答。
   - **グラフコンテキスト連携**: 画面上で選択したノードやサブグラフの文脈を自動的にAIに渡して解説依頼が可能。

3. **Sophisticated Dark デザイン UI**
   - 濃紺・ブラック基調のモダンなセキュリティ分析画面（`#050505` Canvas）。
   - 画面分割（Split View）、グラフ全画面、チャット全画面のシームレスな切り替え。

---

## 🛠 技術スタック

- **フロントエンド**: React 18, Vite, TypeScript, Tailwind CSS
- **グラフライブラリ**: Cytoscape.js
- **アイコン・表示**: Lucide React, React Markdown (Remark GFM)
- **バックエンド API**: Express.js (Node.js)
- **AI SDK**: `@google/genai` (`gemini-3.1-flash-lite` + `googleSearch` Tool)

---

## 📂 ナレッジグラフデータ構造 (`consolidated_kg.json`)

```json
{
  "nodes": [
    {
      "type": "node",
      "label": "ThreatActor",
      "properties": {
        "id": "UNC****",
        "name": "UNC****",
        "motivation": "Cyber Espionage",
        "nexus": "*****"
      }
    }
  ],
  "edges": [
    {
      "type": "edge",
      "label": "USES_MALWARE",
      "from": "UNC****",
      "to": "**********"
    }
  ]
}
```

---

## 🚀 ローカル起動方法

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数の設定
`.env` ファイルを作成し、Gemini API キーを設定します。
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 開発サーバーの起動
```bash
npm run dev
```
ブラウザで `http://localhost:3000` にアクセスします。

### 4. プロダクションビルド & 起動
```bash
npm run build
npm start
```

### 5. 上位プロジェクトのご紹介
このアプリケーションは、上位プロジェクトCyber Angel のナレッジグラフ部分のみを切り出したデモアプリデーションです。
上位プロジェクトは非公開になっており、他の環境で実行しています。
プロジェクトのイメージ図は次のpdfを参照してください。
[Cyber_Angel.pdf](https://github.com/YuyaForest/intel-kg/blob/main/assets/Cyber_Angel.pdf)
