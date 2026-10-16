# NEXORA AI — Technical Architecture

**Tagline:** Your AI. Your Commands. Always Working.

---

## 1. High-Level Architecture

Nexora AI is split into two cleanly decoupled environments:

1. **Client Control Center (Desktop App):**
   - Built on **Electron, React 19, TypeScript, and Tailwind CSS**.
   - Acts as an interactive command-and-control surface.
   - Communicates with the remote cloud API via authenticated REST calls and a bidirectional **WebSocket Gateway**.
   - Does not run background tasks locally. When the application closes or the user's laptop goes to sleep, cloud jobs continue uninterrupted.

2. **Cloud Orchestration & Worker Runtime (Backend Server):**
   - Built on **Node.js, Fastify, and TypeScript**.
   - Integrates **Google Gemini API** (`@google/genai`) for multi-worker decomposition and structured execution planning.
   - Manages a **durable task queue** (BullMQ with Redis in cloud environments; persistent zero-config SQLite queue engine during local offline runs).
   - Coordinates an active pool of **8 specialized workers**:
     - `RESEARCH`: Web searches, citation gathering, structured briefs.
     - `WRITING`: Scriptwriting, articles, video descriptions, titles, tags.
     - `IMAGE`: 16:9 YouTube thumbnail design, visual asset rendering.
     - `VIDEO`: Scene storyboarding, timed SRT subtitle tracks, FFmpeg composition.
     - `BROWSER`: Playwright remote browser automation with live screenshot streaming.
     - `DEVELOPER`: Isolated sandbox workspaces, shell execution, live stdout/stderr streams.
     - `SOCIAL`: YouTube Studio and Drive staging, metadata configuration, upload gate.
     - `OPERATIONS`: System health checks, cron schedules, service monitoring.

---

## 2. Real-Time Streaming & Visual Verification

The Live Activity view distinguishes between:
- **Live Remote Screen:** Streaming frames emitted in real-time by browser/desktop workers.
- **Recent Visual State:** The latest verified snapshot of the active step.
- **Historical Screenshots:** Chronological timeline carousel enabling frame inspection.
- **Live Terminal Logs:** Live stdout, stderr, and command invocations streamed line-by-line via WebSockets.

---

## 3. Human-in-the-Loop Safety Gate

To prevent unintended public publishing or destructive actions:
1. When a worker reaches an externally consequential operation (e.g. `SOCIAL` publishing to YouTube), the worker pauses.
2. The orchestrator transitions the task state to `WAITING_FOR_APPROVAL`.
3. An `APPROVAL_REQUIRED` event is broadcast to the desktop client.
4. The client presents an interactive modal showing parameters, action details, and risk rating (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
5. Upon user confirmation (`APPROVE`), the task automatically resumes execution. If rejected, the task safely terminates.
6. A global **Emergency Stop** immediately halts all workers and cancels running tasks across the entire cluster.
