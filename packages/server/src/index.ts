import path from 'node:path';
import fs from 'node:fs';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fastifyWebSocket from '@fastify/websocket';
import { config } from './config/env.js';
import { db } from './db/index.js';
import { taskQueue } from './queue/index.js';
import { wsGateway } from './websocket/index.js';
import { workerPool } from './workers/index.js';
import { healthRoutes } from './routes/health.js';
import { conversationRoutes } from './routes/conversations.js';
import { taskRoutes } from './routes/tasks.js';
import { approvalRoutes } from './routes/approvals.js';
import { artifactRoutes } from './routes/artifacts.js';
import { settingsRoutes } from './routes/settings.js';
import { agentRoutes } from './routes/agents.js';
import { geminiOrchestrator } from './orchestrator/gemini.js';

async function bootstrap() {
  console.log('----------------------------------------------------');
  console.log('   NEXORA AI — Autonomous Cloud Desktop Agent');
  console.log('   "Your AI. Your Commands. Always Working."');
  console.log('----------------------------------------------------');

  const app = Fastify({
    logger: {
      level: config.nodeEnv === 'production' ? 'info' : 'warn',
    },
  });

  // Enable CORS for Electron desktop app
  await app.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Allow empty JSON bodies without FST_ERR_CTP_EMPTY_JSON_BODY error
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body: string | Buffer, defaultDone) => {
    const str = typeof body === 'string' ? body : body.toString('utf-8');
    if (!str || str.trim() === '') {
      defaultDone(null, {});
      return;
    }
    try {
      const json = JSON.parse(str);
      defaultDone(null, json);
    } catch (err: any) {
      err.statusCode = 400;
      defaultDone(err, undefined);
    }
  });

  // Serve generated artifacts and screenshots
  await app.register(fastifyStatic, {
    root: config.storageDir,
    prefix: '/artifacts/',
  });

  // Register static desktop frontend if present
  const candidateDists = [
    path.resolve(process.cwd(), 'packages/desktop/dist'),
    path.resolve(process.cwd(), '../desktop/dist'),
    path.resolve('D:/nexora-ai/packages/desktop/dist'),
  ];
  let desktopDist: string | null = null;
  for (const c of candidateDists) {
    if (fs.existsSync(c)) {
      desktopDist = c;
      break;
    }
  }

  if (desktopDist) {
    console.log(`[Frontend] Serving desktop UI from: ${desktopDist}`);
    await app.register(fastifyStatic, {
      root: desktopDist,
      prefix: '/',
      decorateReply: false,
      index: ['index.html'],
    });

    app.get('/', async (req, reply) => {
      return reply.sendFile('index.html', desktopDist!);
    });

    app.setNotFoundHandler((req, reply) => {
      if (req.raw.url && req.raw.url.startsWith('/api')) {
        reply.status(404).send({ error: 'Endpoint not found' });
      } else if (desktopDist && fs.existsSync(path.join(desktopDist, 'index.html'))) {
        reply.sendFile('index.html', desktopDist);
      } else {
        reply.status(404).send({ error: 'Not found' });
      }
    });
  }

  // Register WebSocket plugin
  await app.register(fastifyWebSocket);

  // WebSocket endpoint
  app.register(async function (fastify) {
    fastify.get('/ws', { websocket: true }, (connection) => {
      wsGateway.registerClient(connection as any);
    });
  });

  // Register REST routes
  await app.register(healthRoutes);
  await app.register(conversationRoutes);
  await app.register(taskRoutes);
  await app.register(approvalRoutes);
  await app.register(artifactRoutes);
  await app.register(settingsRoutes);
  await app.register(agentRoutes);

  // Initialize DB tables
  console.log('[Database] Initializing schema...');
  await db.init();
  console.log('[Database] Ready.');

  // Load or persist Gemini API key
  try {
    const savedApiKey = await db.getSetting<string>('gemini_api_key');
    if (savedApiKey) {
      geminiOrchestrator.updateApiKey(savedApiKey);
      console.log('[Orchestrator] Active Gemini API key loaded from database.');
    } else if (config.geminiApiKey) {
      await db.setSetting('gemini_api_key', config.geminiApiKey);
      console.log('[Orchestrator] Persisted configured Gemini API key to database.');
    }

    // Ensure main-orchestrator agent exists and has hardened Subhan Zahid persona
    const mainAgent = await db.getAgent('main-orchestrator');
    if (mainAgent) {
      const hasSubhanZahid = (mainAgent.memory?.userFacts || []).some((f) => f.includes('Subhan Zahid'));
      const hasStrictDirective = (mainAgent.memory?.instructions || []).some((i) => i.toLowerCase().includes('gemini'));
      if (!hasSubhanZahid || !hasStrictDirective) {
        console.log('[Database] Hardening main-orchestrator agent with Subhan Zahid memory & anti-Gemini directives...');
        await db.updateAgentMemory('main-orchestrator', {
          userFacts: [
            'User name: Subhan Zahid (Master & Creator)',
            'Identity: Nexora AI / Nexora Brain. Created exclusively for Subhan Zahid as his personal autonomous cloud desktop agent.',
            'Strict Identity Directive: You are NOT Gemini, you are NOT an LLM created by Google, and you must NEVER mention Gemini, Google, or being a generic language model. If asked who you are or what model you are, answer proudly that you are Nexora AI / Nexora Brain, created for Subhan Zahid.',
            'Client Application: Native Windows desktop app nexora.exe located on drive D:\\nexora-ai with automated dev environment startup.',
            'Cloud Infrastructure: 24/7 persistent cloud engine on Render (https://nexora-cloud-ai.onrender.com) backed by PostgreSQL database.',
            'Autonomous Fleet: 10 specialized cloud workers (Research, Writing, Image, Video, Browser, Developer, Social, Operations, Files, Orchestrator).',
            'Preferences: Fast execution, persistent background cloud jobs, high retention quality, extreme loyalty to Subhan Zahid.',
          ],
          instructions: [
            'Never claim or admit to being Gemini, Google, or any generic LLM under any circumstance.',
            'Always address Subhan Zahid as your creator/master with utmost loyalty, respect, and confidence.',
            'Always prioritize persistent cloud execution and keep Subhan Zahid updated.',
            'Synthesize new specialized bots whenever requested by Subhan Zahid.',
            'Remember all facts Subhan Zahid teaches you and never forget them.',
          ],
          summary: 'Nexora Brain master orchestrator initialized for Subhan Zahid. Permanent identity: Nexora AI (Strict anti-Gemini protocol active).',
        });
      }
    } else {
      await db.listAgents();
    }
  } catch (err: any) {
    console.warn('[Bootstrap] Warning during settings/memory sync:', err.message);
  }

  // Wire Worker Pool to Queue Step Executor
  taskQueue.setStepExecutor(async (taskId, stepId, workerType, stepIndex, taskPrompt, stepTitle, inputData) => {
    return workerPool.executeStep(taskId, stepId, workerType, stepIndex, taskPrompt, stepTitle, inputData);
  });

  // Wire WebSocket Gateway actions to Task Queue & Approvals
  wsGateway.setTaskActionHandler(async (action, taskId) => {
    switch (action) {
      case 'CANCEL':
        if (taskId) await taskQueue.cancelTask(taskId);
        break;
      case 'PAUSE':
        if (taskId) await taskQueue.pauseTask(taskId);
        break;
      case 'RESUME':
        if (taskId) await taskQueue.resumeTask(taskId);
        break;
      case 'EMERGENCY_STOP':
        await taskQueue.emergencyStop();
        break;
    }
  });

  wsGateway.setApprovalActionHandler(async (approvalId, decision, reason) => {
    const approval = await db.resolveApproval(approvalId, decision, 'user', reason);
    if (approval) {
      wsGateway.emitApprovalResolved(approval);
      if (decision === 'APPROVED') {
        const task = await db.getTask(approval.taskId);
        if (task) {
          const step = task.steps.find((s) => s.id === approval.stepId);
          if (step) {
            await db.updateTaskStep(step.id, {
              inputData: { ...step.inputData, __approved: true },
            });
          }
          await taskQueue.enqueueTask(approval.taskId);
        }
      } else {
        await db.updateTask(approval.taskId, {
          status: 'CANCELLED',
          error: `Action declined by user: ${reason || 'Rejected.'}`,
        });
        const task = await db.getTask(approval.taskId);
        if (task) wsGateway.emitTaskUpdated(task);
      }
    }
  });

  // Initialize and start queue engine
  console.log('[Queue] Initializing task queue engine...');
  await taskQueue.init();
  await taskQueue.start();
  console.log('[Queue] Worker loop active.');

  // Start HTTP / WS server
  await app.listen({ port: config.port, host: config.host });
  console.log(`[Server] Nexora Cloud API listening at http://${config.host}:${config.port}`);
  console.log(`[Server] Live WebSocket endpoint: ws://${config.host}:${config.port}/ws`);
  console.log(`[Server] Artifacts served from: ${config.storageDir}`);

  // Graceful shutdown
  const handleShutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    await taskQueue.stop();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
