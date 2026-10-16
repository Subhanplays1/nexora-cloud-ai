import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { orchestrator } from '../orchestrator/gemini.js';
import { workerPool } from '../workers/index.js';
import { config } from '../config/env.js';

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/health', async () => {
    let dbStatus = 'HEALTHY';
    try {
      await db.listConversations();
    } catch {
      dbStatus = 'DEGRADED';
    }

    return {
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      services: {
        server: { status: 'ONLINE', port: config.port },
        database: { status: dbStatus, type: config.databaseUrl ? 'PostgreSQL' : 'SQLite' },
        queue: { status: 'ONLINE', mode: config.redisUrl ? 'Redis BullMQ' : 'Persistent DB Engine' },
        gemini: {
          status: orchestrator.isConfigured() ? 'CONFIGURED' : 'READY_WITH_FALLBACK',
          model: config.geminiModel,
        },
        workers: {
          count: workerPool.getWorkerInfos().length,
          active: workerPool.getWorkerInfos().filter((w) => w.status === 'BUSY').length,
        },
      },
    };
  });
}
