import { db } from '../db/index.js';
import { wsGateway } from '../websocket/index.js';
import { executeResearchWorker } from './research.js';
import { executeWritingWorker } from './writing.js';
import { executeImageWorker } from './image.js';
import { executeVideoWorker } from './video.js';
import { executeBrowserWorker } from './browser.js';
import { executeDeveloperWorker } from './developer.js';
import { executeSocialWorker } from './social.js';
import { executeOperationsWorker } from './operations.js';
export class WorkerPoolCoordinator {
    workers = new Map();
    constructor() {
        this.initWorkers();
    }
    initWorkers() {
        const list = [
            {
                type: 'RESEARCH',
                name: 'Research Worker',
                description: 'Multi-source research, citation, and intelligence briefs',
                status: 'IDLE',
                supportedTools: ['web_search', 'extract_sources', 'synthesize_brief'],
            },
            {
                name: 'Writing Worker',
                type: 'WRITING',
                description: 'Scripts, long-form articles, YouTube titles, and descriptions',
                status: 'IDLE',
                supportedTools: ['draft_script', 'format_markdown', 'generate_metadata'],
            },
            {
                name: 'Thumbnail & Image Worker',
                type: 'IMAGE',
                description: '16:9 YouTube thumbnail design, visual asset synthesis',
                status: 'IDLE',
                supportedTools: ['generate_image', 'render_thumbnail', 'resize_asset'],
            },
            {
                name: 'Video Production Worker',
                type: 'VIDEO',
                description: 'Scene planning, subtitles, FFmpeg composition, audio sync',
                status: 'IDLE',
                supportedTools: ['storyboard', 'generate_srt', 'ffmpeg_assemble'],
            },
            {
                name: 'Browser Automation Worker',
                type: 'BROWSER',
                description: 'Playwright headless browser, form filling, live screenshot stream',
                status: 'IDLE',
                supportedTools: ['navigate', 'click', 'fill_form', 'capture_screenshot'],
            },
            {
                name: 'Developer Worker',
                type: 'DEVELOPER',
                description: 'Code workspace, file editing, shell command execution, tests',
                status: 'IDLE',
                supportedTools: ['create_file', 'run_command', 'run_tests', 'view_diff'],
            },
            {
                name: 'Social Media Worker',
                type: 'SOCIAL',
                description: 'YouTube and Drive staging, metadata configuration, upload gate',
                status: 'IDLE',
                supportedTools: ['stage_upload', 'manage_metadata', 'request_publish_approval'],
            },
            {
                name: 'Operations Worker',
                type: 'OPERATIONS',
                description: 'Health auditing, endpoint monitoring, scheduled automations',
                status: 'IDLE',
                supportedTools: ['ping_service', 'health_check', 'monitor_cron'],
            },
        ];
        for (const w of list) {
            this.workers.set(w.type, w);
        }
    }
    getWorkerInfos() {
        return Array.from(this.workers.values());
    }
    setWorkerStatus(type, status, currentTaskId) {
        const w = this.workers.get(type);
        if (w) {
            w.status = status;
            w.currentTaskId = currentTaskId;
            wsGateway.emitWorkerStatuses(this.getWorkerInfos());
        }
    }
    async executeStep(taskId, stepId, workerType, stepIndex, taskPrompt, stepTitle, inputData = {}) {
        this.setWorkerStatus(workerType, 'BUSY', taskId);
        const onLog = async (logLine) => {
            console.log(`[Worker:${workerType}]`, logLine);
            await db.appendTaskStepLog(stepId, logLine);
            const step = await db.getTask(taskId).then((t) => t?.steps.find((s) => s.id === stepId));
            if (step) {
                wsGateway.emitTaskStepUpdated(taskId, step);
            }
        };
        const req = {
            taskId,
            stepId,
            workerType,
            taskTitle: taskPrompt,
            stepTitle,
            prompt: taskPrompt,
            parameters: inputData,
        };
        try {
            let result;
            switch (workerType) {
                case 'RESEARCH':
                    result = await executeResearchWorker(req, onLog);
                    break;
                case 'WRITING':
                    result = await executeWritingWorker(req, onLog);
                    break;
                case 'IMAGE':
                    result = await executeImageWorker(req, onLog);
                    break;
                case 'VIDEO':
                    result = await executeVideoWorker(req, onLog);
                    break;
                case 'BROWSER':
                    result = await executeBrowserWorker(req, onLog);
                    break;
                case 'DEVELOPER':
                    result = await executeDeveloperWorker(req, onLog);
                    break;
                case 'SOCIAL':
                    result = await executeSocialWorker(req, onLog);
                    break;
                case 'OPERATIONS':
                    result = await executeOperationsWorker(req, onLog);
                    break;
                default:
                    throw new Error(`Unknown worker type: ${workerType}`);
            }
            this.setWorkerStatus(workerType, 'IDLE');
            return {
                success: result.success,
                outputData: result.outputData,
                error: result.error,
                screenshotUrl: result.screenshotUrl,
                terminalOutput: result.terminalOutput,
            };
        }
        catch (err) {
            this.setWorkerStatus(workerType, 'ERROR');
            await onLog(`[Error] Worker failure: ${err.message}`);
            return {
                success: false,
                error: err.message,
            };
        }
    }
}
export const workerPool = new WorkerPoolCoordinator();
//# sourceMappingURL=index.js.map