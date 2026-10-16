import { db } from '../db/index.js';
import { taskQueue } from '../queue/index.js';
import { wsGateway } from '../websocket/index.js';
export async function approvalRoutes(fastify) {
    // List pending approvals
    fastify.get('/api/approvals', async () => {
        return db.listPendingApprovals();
    });
    // Resolve approval decision (APPROVE or REJECT)
    fastify.post('/api/approvals/:id/resolve', async (req, reply) => {
        const { decision, reason, respondedBy = 'user' } = req.body;
        const approval = await db.resolveApproval(req.params.id, decision, respondedBy, reason);
        if (!approval) {
            return reply.status(404).send({ error: 'Approval request not found' });
        }
        wsGateway.emitApprovalResolved(approval);
        if (decision === 'APPROVED') {
            // Find task step and mark it with approval flag, then resume task in queue
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
        }
        else {
            // Rejection marks task failed or cancelled
            await db.updateTask(approval.taskId, {
                status: 'CANCELLED',
                error: `Action rejected by user: ${reason || 'User declined approval.'}`,
            });
            const task = await db.getTask(approval.taskId);
            if (task)
                wsGateway.emitTaskUpdated(task);
        }
        return approval;
    });
}
//# sourceMappingURL=approvals.js.map