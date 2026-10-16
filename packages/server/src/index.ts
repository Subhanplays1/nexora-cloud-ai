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

  // Initialize DB tables
  console.log('[Database] Initializing schema...');
  await db.init();
  console.log('[Database] Ready.');

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
