import { db } from '../db/index.js';
export async function artifactRoutes(fastify) {
    fastify.get('/api/artifacts', async (req) => {
        return db.listArtifacts(req.query.taskId);
    });
}
//# sourceMappingURL=artifacts.js.map