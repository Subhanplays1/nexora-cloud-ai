# NEXORA AI — Autonomous Cloud Desktop Agent

> **"Your AI. Your Commands. Always Working."**

Nexora AI is a production-grade personal productivity assistant that combines conversational planning with autonomous cloud task execution.

Delegate complex, multi-step tasks by typing or speaking naturally, then close your laptop and let Nexora AI's persistent cloud workers plan, execute, monitor, and report the results.

---

## 🌟 Key Features

- **Decoupled Cloud Architecture:** All long-running tasks execute on a remote cloud server or VPS, not locally on your laptop battery or RAM.
- **Laptop-Independent Persistence:** Close your laptop, lose internet connectivity, or restart your computer — cloud tasks continue running and report results when you reopen the app.
- **Live Remote Computer View:** Watch real-time execution as it happens, including live browser screenshots, terminal stdout/stderr streams, step progress, and an emergency stop.
- **8 Specialized Cloud Workers:**
  1. **Research Worker:** In-depth topic search, verified sources, and structured research briefs.
  2. **Writing Worker:** Tone-aware scripts, formatted articles, YouTube descriptions, titles, and tags.
  3. **Thumbnail & Image Worker:** 16:9 YouTube thumbnail assets (1280x720) with high visual retention.
  4. **Video Production Worker:** Scene-by-scene storyboards, subtitle SRT generation, and FFmpeg assembly.
  5. **Browser Automation Worker:** Playwright headless/headed browser navigation, form interaction, and live frame streaming.
  6. **Developer Worker:** Isolated workspace management, code generation, shell command execution, and test verification.
  7. **Social Media Worker:** YouTube and Google Drive upload staging with strict approval gates.
  8. **Operations Worker:** Infrastructure health monitoring, recurring cron tasks, and endpoint auditing.
- **Google Gemini Reasoning:** Powered by `@google/genai` (configured with `gemini-3.8-flash` or `gemini-4-argon`) for natural language task decomposition and streaming conversational feedback.
- **Human-in-the-Loop Safety Gate:** Consequential actions (e.g. publishing publicly or modifying external services) require explicit user approval before execution.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v20+ or v24
- npm v10+

### 1. Install & Build
```bash
cd D:/nexora-ai
npm run build:shared
npm run build:server
npm run build:desktop
```

### 2. Start the Cloud Backend Server
```bash
npm run start:server
```
The server will start at `http://localhost:3001` with WebSocket streaming at `ws://localhost:3001/ws`.

### 3. Start the Desktop App
In a separate terminal:
```bash
npm run dev:desktop
```
Or open the built frontend in your browser at `http://localhost:5173`.

---

## ☁️ Cloud VPS Deployment (Production)

Deploy the entire backend stack with PostgreSQL, Redis, Playwright, and FFmpeg using Docker Compose:

```bash
# 1. Clone repository to your VPS
git clone <your-repo> /opt/nexora-ai
cd /opt/nexora-ai

# 2. Configure environment
cp .env.example .env
nano .env

# 3. Launch Docker Compose stack
docker compose up -d --build
```

See [docs/VPS_DEPLOYMENT.md](docs/VPS_DEPLOYMENT.md) for full instructions, including Nginx SSL configuration and domain setup.

---

## 🧪 Testing

Run automated tests verifying the database, orchestrator, 8 worker definitions, queue execution, and restart recovery:

```bash
cd packages/server
npm test
```

---

## 🛡️ Security

- **Server-Side API Secrets:** Gemini API keys and OAuth tokens are stored exclusively on the backend server environment and are never transmitted to the Electron desktop frontend.
- **Sandboxed Workspaces:** Developer and browser workers operate within isolated working directories.
- **Safety Gates:** Critical actions trigger interactive approval prompts before external mutation occurs.
- **Emergency Stop:** A global kill switch immediately halts all running tasks across the entire cluster.
