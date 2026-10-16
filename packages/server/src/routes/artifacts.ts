import { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../db/index.js';

export async function artifactRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/artifacts', async (req: FastifyRequest<{ Querystring: { taskId?: string } }>) => {
    return db.listArtifacts(req.query.taskId);
  });
}
