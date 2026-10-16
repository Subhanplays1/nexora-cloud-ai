import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.js';
export class GeminiOrchestrator {
    client;
    constructor() {
        if (config.geminiApiKey) {
            this.client = new GoogleGenAI({ apiKey: config.geminiApiKey });
        }
    }
    isConfigured() {
        return Boolean(config.geminiApiKey);
    }
    updateApiKey(newKey) {
        config.geminiApiKey = newKey;
        this.client = new GoogleGenAI({ apiKey: newKey });
    }
    async planExecution(userPrompt, history = []) {
        if (this.client) {
            try {
                return await this.planWithGemini(userPrompt, history);
            }
            catch (err) {
                console.warn('[Gemini] Error calling Gemini API, falling back to heuristic planner:', err.message);
            }
        }
        return this.planWithHeuristics(userPrompt);
    }
    async planWithGemini(userPrompt, history = []) {
        const prompt = `
You are Nexora AI, an autonomous cloud desktop agent.
A user gave this command: "${userPrompt}"

Analyze the user's intent and break it down into an executable workflow assigned to specialized cloud workers:
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
  "thought": "brief reasoning on how to solve this",
  "taskTitle": "Clear, concise title of the overall task",
  "conversationalReply": "A polite, confident message to the user acknowledging the request and describing the plan",
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
        const response = await this.client.models.generateContent({
            model: config.geminiModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
            },
        });
        const text = response.text || '{}';
        const parsed = JSON.parse(text);
        return {
            thought: parsed.thought || 'Decomposed task into specialized cloud worker steps.',
            taskTitle: parsed.taskTitle || userPrompt.slice(0, 60),
            conversationalReply: parsed.conversationalReply || `I've planned this workflow and queued it for cloud execution.`,
            steps: (parsed.steps || []).map((s) => ({
                workerType: s.workerType,
                title: s.title || 'Execute step',
                description: s.description || '',
                inputData: s.inputData || {},
            })),
        };
    }
    planWithHeuristics(userPrompt) {
        const p = userPrompt.toLowerCase();
        const steps = [];
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
        }
        else if (p.includes('thumbnail') || p.includes('image')) {
            title = 'Thumbnail & Visual Asset Generation';
            steps.push({
                workerType: 'IMAGE',
                title: 'Generate Visual Assets & Thumbnails',
                description: `Design high-impact visual concepts for: "${userPrompt}"`,
                inputData: { prompt: userPrompt, dimensions: '1280x720', aspectRatio: '16:9' },
            });
        }
        else if (p.includes('browse') || p.includes('open') || p.includes('website') || p.includes('form') || p.includes('url')) {
            title = 'Remote Browser Automation';
            steps.push({
                workerType: 'BROWSER',
                title: 'Navigate Target Page & Capture Live Activity',
                description: `Open browser, navigate to target website, inspect elements, and record screenshots.`,
                inputData: { command: userPrompt },
            });
        }
        else if (p.includes('code') || p.includes('developer') || p.includes('project') || p.includes('test') || p.includes('build')) {
            title = 'Developer Workspace Execution';
            steps.push({
                workerType: 'DEVELOPER',
                title: 'Scaffold and Execute Code Workspace',
                description: `Create project files, run commands, and execute tests: "${userPrompt}"`,
                inputData: { instruction: userPrompt },
            });
        }
        else if (p.includes('video') || p.includes('render') || p.includes('ffmpeg')) {
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
        }
        else if (p.includes('youtube') || p.includes('upload') || p.includes('drive') || p.includes('social')) {
            title = 'Social Media Staging & Publishing';
            steps.push({
                workerType: 'SOCIAL',
                title: 'Prepare Media Upload and Metadata',
                description: `Stage YouTube upload package with title, description, tags, and thumbnail. Requires user approval before publishing.`,
                inputData: { command: userPrompt },
            });
        }
        else if (p.includes('monitor') || p.includes('health') || p.includes('status') || p.includes('check')) {
            title = 'Operations Health Check';
            steps.push({
                workerType: 'OPERATIONS',
                title: 'Inspect System Health and Services',
                description: `Perform health checks on configured endpoints and verify server metrics.`,
                inputData: { target: userPrompt },
            });
        }
        else {
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
            conversationalReply: `I've analyzed your command and formulated an execution plan with ${steps.length} specialized task steps. The cloud workers will begin processing immediately.`,
            steps,
        };
    }
    async streamConversationalResponse(userMessage, history, onChunk) {
        if (this.client) {
            try {
                const stream = await this.client.models.generateContentStream({
                    model: config.geminiModel,
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                {
                                    text: `You are Nexora AI, an intelligent, capable, autonomous cloud desktop assistant. Respond helpfully, clearly, and concisely to the user.\nUser: ${userMessage}`,
                                },
                            ],
                        },
                    ],
                });
                let full = '';
                for await (const chunk of stream) {
                    const t = chunk.text || '';
                    full += t;
                    onChunk(t);
                }
                return full;
            }
            catch (err) {
                console.warn('[Gemini] Stream error:', err.message);
            }
        }
        // Fallback stream simulation
        const defaultResponse = `I have received your request: "${userMessage}".\n\nI am orchestrating the task on the cloud backend. You can monitor live progress, screenshots, and terminal outputs in the Live Activity panel.`;
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
//# sourceMappingURL=gemini.js.map