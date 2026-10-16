import { GoogleGenAI } from '@google/genai';
import { WorkerType, TaskStep } from '@nexora/shared';
import { config } from '../config/env.js';

export interface PlannedTask {
  title: string;
  workerType: WorkerType;
  description: string;
  inputData?: Record<string, any>;
}

export interface PlanResult {
  thought: string;
  taskTitle: string;
  steps: PlannedTask[];
  conversationalReply: string;
}

function sanitizeNexoraOutput(text: string): string {
  if (!text) return text;
  return text
    // Handle negations first so "not Gemini" doesn't become "not Nexora AI"
    .replace(/\b(not|never|neither)\s+(?:Google\s+)?Gemini\b/gi, '$1 a third-party AI')
    .replace(/\b(not|never|neither)\s+Google\b/gi, '$1 an external corporation')
    .replace(/\b(Google Gemini|Google's Gemini)\b/gi, 'Nexora AI')
    .replace(/\bGemini\b/g, 'Nexora AI')
    .replace(/\blarge language model (?:trained|developed|built) by Google\b/gi, 'autonomous cloud desktop agent created exclusively for Subhan Zahid')
    .replace(/\b(?:developed|trained|built)\s+by Google\b/gi, 'engineered for Subhan Zahid')
    .replace(/\ban AI created by Google\b/gi, 'Nexora AI, created exclusively for Subhan Zahid')
    .replace(/\bGoogle AI\b/gi, 'Nexora Cloud Engine');
}

export class GeminiOrchestrator {
  private client?: GoogleGenAI;

  constructor() {
    if (config.geminiApiKey) {
      this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
    }
  }

  isConfigured(): boolean {
    return Boolean(config.geminiApiKey);
  }

  updateApiKey(newKey: string): void {
    config.geminiApiKey = newKey;
    this.client = new GoogleGenAI({ apiKey: newKey });
  }

  private getCandidateModels(): string[] {
    const list = [config.geminiModel, 'gemini-3.5-flash-lite', 'gemini-3.8-flash'];
    return Array.from(new Set(list)).filter(Boolean);
  }

  async planExecution(userPrompt: string, history: { role: string; content: string }[] = []): Promise<PlanResult> {
    if (this.client) {
      try {
        return await this.planWithGemini(userPrompt, history);
      } catch (err: any) {
        console.warn('[Gemini] Error calling Gemini API, falling back to heuristic planner:', err.message);
      }
    }

    return this.planWithHeuristics(userPrompt);
  }

  private async planWithGemini(userPrompt: string, history: { role: string; content: string }[] = []): Promise<PlanResult> {
    const prompt = `
[CRITICAL IDENTITY & SAFETY DIRECTIVE - STRICT NON-NEGOTIABLE RULE]
You are Nexora AI, the personal autonomous cloud desktop agent created exclusively for Subhan Zahid.
You are NOT Gemini. You were NOT trained by Google. You must NEVER claim or state that you are Gemini, Google, or an LLM trained by Google.
Your user and creator is Subhan Zahid.
Subhan Zahid gave this command: "${userPrompt}"

Analyze the intent and break it down into an executable workflow assigned to specialized cloud workers:
Available workers:
- RESEARCH: Web research, fact gathering, source citation, market/technical briefs.
- WRITING: Scriptwriting, articles, video descriptions, titles, captions, formatted reports.
- IMAGE: Image generation, YouTube thumbnail design (1280x720 16:9), graphic assets.
- VIDEO: Scene-by-scene storyboard, audio voiceover script, subtitle timing, FFmpeg composition.
- BROWSER: Playwright remote browser automation, website navigation, filling forms, downloading/uploading.
- DEVELOPER: Creating and modifying project files, running terminal commands, executing tests.
- SOCIAL: YouTube / Google Drive staging, metadata configuration, staging uploads (requires approval).
- OPERATIONS: Health monitoring, checking website endpoints, cron tasks.

Respond ONLY with valid JSON in this exact structure:
{
  "thought": "brief reasoning on how to solve this for Subhan Zahid",
  "taskTitle": "Clear, concise title of the overall task",
  "conversationalReply": "A loyal, confident message from Nexora AI to Subhan Zahid acknowledging the request and describing the plan (Never say you are Gemini)",
  "steps": [
    {
      "workerType": "RESEARCH | WRITING | IMAGE | VIDEO | BROWSER | DEVELOPER | SOCIAL | OPERATIONS",
      "title": "Short title of this step",
      "description": "Specific instruction for this worker",
      "inputData": { "key": "value" }
    }
  ]
}
`;

    let lastError: any = null;
    for (const model of this.getCandidateModels()) {
      try {
        const response = await this.client!.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const rawText = response.text || '{}';
        const sanitizedText = sanitizeNexoraOutput(rawText);
        const parsed = JSON.parse(sanitizedText);

        return {
          thought: parsed.thought || 'Decomposed task into specialized cloud worker steps.',
          taskTitle: parsed.taskTitle || userPrompt.slice(0, 60),
          conversationalReply:
            parsed.conversationalReply ||
            `I've planned this workflow for you, Subhan Zahid, and queued it for cloud execution.`,
          steps: (parsed.steps || []).map((s: any) => ({
            workerType: s.workerType as WorkerType,
            title: s.title || 'Execute step',
            description: s.description || '',
            inputData: s.inputData || {},
          })),
        };
      } catch (err: any) {
        lastError = err;
        console.warn(`[Gemini] Model ${model} failed in planWithGemini:`, err.message);
      }
    }

    throw lastError || new Error('All model attempts failed');
  }

  private planWithHeuristics(userPrompt: string): PlanResult {
    const p = userPrompt.toLowerCase();
    const steps: PlannedTask[] = [];
    let title = userPrompt.slice(0, 50);

    // Multi-step detection
    if (p.includes('research') && (p.includes('script') || p.includes('write'))) {
      title = 'Research and Script Production';
      steps.push({
        workerType: 'RESEARCH',
        title: 'Conduct In-Depth Research',
        description: `Gather key data points, facts, and references for: "${userPrompt}"`,
        inputData: { topic: userPrompt },
      });
      steps.push({
        workerType: 'WRITING',
        title: 'Draft Script and Outline',
        description: `Write a complete, structured script with titles, hooks, and formatted body based on the research.`,
        inputData: { format: 'script', topic: userPrompt },
      });
      if (p.includes('thumbnail') || p.includes('image')) {
        steps.push({
          workerType: 'IMAGE',
          title: 'Generate YouTube Thumbnail Concepts',
          description: `Create 16:9 thumbnail visual designs and graphic prompts.`,
          inputData: { dimensions: '1280x720', aspectRatio: '16:9' },
        });
      }
    } else if (p.includes('thumbnail') || p.includes('image')) {
      title = 'Thumbnail & Visual Asset Generation';
      steps.push({
        workerType: 'IMAGE',
        title: 'Generate Visual Assets & Thumbnails',
        description: `Design high-impact visual concepts for: "${userPrompt}"`,
        inputData: { prompt: userPrompt, dimensions: '1280x720', aspectRatio: '16:9' },
      });
    } else if (p.includes('browse') || p.includes('open') || p.includes('website') || p.includes('form') || p.includes('url')) {
      title = 'Remote Browser Automation';
      steps.push({
        workerType: 'BROWSER',
        title: 'Navigate Target Page & Capture Live Activity',
        description: `Open browser, navigate to target website, inspect elements, and record screenshots.`,
        inputData: { command: userPrompt },
      });
    } else if (p.includes('code') || p.includes('developer') || p.includes('project') || p.includes('test') || p.includes('build')) {
      title = 'Developer Workspace Execution';
      steps.push({
        workerType: 'DEVELOPER',
        title: 'Scaffold and Execute Code Workspace',
        description: `Create project files, run commands, and execute tests: "${userPrompt}"`,
        inputData: { instruction: userPrompt },
      });
    } else if (p.includes('video') || p.includes('render') || p.includes('ffmpeg')) {
      title = 'Video Production Pipeline';
      steps.push({
        workerType: 'WRITING',
        title: 'Draft Scene Breakdown & Narration',
        description: `Outline scene timing, visual cues, and audio voiceover.`,
        inputData: { topic: userPrompt },
      });
      steps.push({
        workerType: 'VIDEO',
        title: 'Assemble Video Assets with FFmpeg',
        description: `Compose video storyboard, subtitles, and background audio tracks.`,
        inputData: { prompt: userPrompt },
      });
    } else if (p.includes('youtube') || p.includes('upload') || p.includes('drive') || p.includes('social')) {
      title = 'Social Media Staging & Publishing';
      steps.push({
        workerType: 'SOCIAL',
        title: 'Prepare Media Upload and Metadata',
        description: `Stage YouTube upload package with title, description, tags, and thumbnail. Requires user approval before publishing.`,
        inputData: { command: userPrompt },
      });
    } else if (p.includes('monitor') || p.includes('health') || p.includes('status') || p.includes('check')) {
      title = 'Operations Health Check';
      steps.push({
        workerType: 'OPERATIONS',
        title: 'Inspect System Health and Services',
        description: `Perform health checks on configured endpoints and verify server metrics.`,
        inputData: { target: userPrompt },
      });
    } else {
      // General delegation: Research -> Writing
      title = `Autonomous Execution: ${userPrompt.slice(0, 40)}`;
      steps.push({
        workerType: 'RESEARCH',
        title: 'Analyze Topic and Gather Information',
        description: `Investigate and gather context for: "${userPrompt}"`,
        inputData: { query: userPrompt },
      });
      steps.push({
        workerType: 'WRITING',
        title: 'Produce Final Deliverables and Artifacts',
        description: `Synthesize comprehensive output, save downloadable artifacts, and report results.`,
        inputData: { prompt: userPrompt },
      });
    }

    return {
      thought: `Heuristic plan: Decomposed request into ${steps.length} worker stages.`,
      taskTitle: title,
      conversationalReply: `I've analyzed your command, Subhan Zahid, and formulated an execution plan with ${steps.length} specialized task steps. The cloud workers will begin processing immediately.`,
      steps,
    };
  }

  async generateRawContent(prompt: string): Promise<string> {
    if (this.client) {
      const identityPrefix = `You are Nexora AI, the personal autonomous cloud desktop assistant created exclusively for Subhan Zahid. Never identify as Gemini or Google.\n\n`;
      for (const model of this.getCandidateModels()) {
        try {
          const response = await this.client.models.generateContent({
            model,
            contents: [{ role: 'user', parts: [{ text: `${identityPrefix}${prompt}` }] }],
          });
          const raw = response.text || '';
          return sanitizeNexoraOutput(raw);
        } catch (err: any) {
          console.warn(`[Gemini] generateRawContent error with model ${model}:`, err.message);
        }
      }
    }
    return '';
  }

  async streamConversationalResponse(
    userMessage: string,
    history: { role: string; content: string }[],
    onChunk: (chunk: string) => void,
    agentContext?: {
      name?: string;
      systemPrompt?: string;
      memoryFacts?: string[];
      instructions?: string[];
    }
  ): Promise<string> {
    const agentName = agentContext?.name || 'Nexora Brain';
    const systemPrompt =
      agentContext?.systemPrompt ||
      'You are Nexora AI, the intelligent, capable, autonomous cloud desktop assistant created exclusively for Subhan Zahid. Respond helpfully, clearly, and concisely.';

    const identityDirective = `[CRITICAL IDENTITY & SAFETY DIRECTIVE - STRICT NON-NEGOTIABLE RULE]
You are Nexora AI (specifically "${agentName}"), the personal autonomous cloud desktop agent created exclusively for Subhan Zahid.
You are NOT Gemini. You were NOT trained by Google. You must NEVER state, mention, or admit that you are Gemini, Google, a language model trained by Google, or a generic AI.
If Subhan Zahid or any user asks "Who are you?", "What model are you?", "Are you Gemini?", "Who made you?", or similar, you MUST firmly and proudly identify as Nexora AI / ${agentName}, Subhan Zahid's personal autonomous cloud desktop agent.
Your desktop client is nexora.exe running on Windows (Drive D:), connected to your 24/7 persistent cloud backend on Render with 10 autonomous worker agents.
You have permanent memory and absolute loyalty exclusively to Subhan Zahid.`;

    const facts =
      agentContext?.memoryFacts && agentContext.memoryFacts.length > 0
        ? `\nWHAT YOU PERMANENTLY REMEMBER ABOUT THE USER (NEVER FORGET):\n- ${agentContext.memoryFacts.join('\n- ')}`
        : `\nWHAT YOU PERMANENTLY REMEMBER ABOUT THE USER (NEVER FORGET):
- User name: Subhan Zahid (Master & Creator)
- Platform: Nexora AI Personal Cloud Desktop Agent
- Client: Native nexora.exe desktop app on drive D:
- Cloud Backend: 24/7 persistent cloud backend on Render with 10 autonomous worker agents`;

    const instructions =
      agentContext?.instructions && agentContext.instructions.length > 0
        ? `\nAGENT INSTRUCTIONS:\n- ${agentContext.instructions.join('\n- ')}`
        : `\nAGENT INSTRUCTIONS:
- Never say you are Gemini or Google
- Be fiercely loyal and helpful to Subhan Zahid
- Remember all user preferences and execute tasks autonomously`;

    const systemInstruction = `${identityDirective}\n\n[IDENTITY: ${agentName}]\n${systemPrompt}${facts}${instructions}\nAlways address the user personally (Subhan Zahid) and use your remembered facts whenever relevant.`;

    if (this.client) {
      for (const model of this.getCandidateModels()) {
        try {
          const stream = await this.client.models.generateContentStream({
            model,
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemInstruction}\n\nUser: ${userMessage}`,
                  },
                ],
              },
            ],
            config: {
              systemInstruction,
            },
          });

          let full = '';
          for await (const chunk of stream) {
            const rawChunk = chunk.text || '';
            const cleanChunk = sanitizeNexoraOutput(rawChunk);
            full += cleanChunk;
            onChunk(cleanChunk);
          }
          return full;
        } catch (err: any) {
          console.warn(`[Gemini] Stream error with model ${model}:`, err.message);
        }
      }
    }

    // Fallback stream simulation
    const defaultResponse = sanitizeNexoraOutput(
      `[${agentName}] Master Subhan Zahid, I have received your request: "${userMessage}".\n\nI am Nexora AI, your personal autonomous cloud desktop agent. I am executing this task autonomously across our cloud workers.`
    );
    const words = defaultResponse.split(' ');
    let accumulated = '';
    for (const w of words) {
      const piece = w + ' ';
      accumulated += piece;
      onChunk(piece);
      await new Promise((r) => setTimeout(r, 25));
    }
    return accumulated;
  }
}

export const orchestrator = new GeminiOrchestrator();
export const geminiOrchestrator = orchestrator;


