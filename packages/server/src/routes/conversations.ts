import { FastifyInstance, FastifyRequest } from 'fastify';
import { db } from '../db/index.js';
import { orchestrator } from '../orchestrator/gemini.js';
import { taskQueue } from '../queue/index.js';
import { wsGateway } from '../websocket/index.js';

export async function conversationRoutes(fastify: FastifyInstance): Promise<void> {
  // List all conversations
  fastify.get('/api/conversations', async () => {
    return db.listConversations();
  });

  // Create new conversation
  fastify.post('/api/conversations', async (req: FastifyRequest<{ Body: { title?: string } }>) => {
    const title = req.body?.title || 'New Task Session';
    return db.createConversation(title);
  });

  // Get specific conversation with full messages
  fastify.get('/api/conversations/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const conv = await db.getConversation(req.params.id);
    if (!conv) {
      return reply.status(404).send({ error: 'Conversation not found' });
    }
    return conv;
  });

  // Delete conversation
  fastify.delete('/api/conversations/:id', async (req: FastifyRequest<{ Params: { id: string } }>) => {
    await db.deleteConversation(req.params.id);
    return { success: true };
  });

  // Post message to conversation (initiates AI reasoning & autonomous task planning)
  fastify.post(
    '/api/conversations/:id/messages',
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: { content: string; executeAsTask?: boolean };
      }>
    ) => {
      const { content, executeAsTask = true } = req.body;
      const conversationId = req.params.id;

      // Save user message
      const userMsg = await db.createMessage({
        conversationId,
        role: 'user',
        content,
        status: 'SENT',
      });

      // Prepare assistant message record
      const assistantMsg = await db.createMessage({
        conversationId,
        role: 'assistant',
        content: 'Analyzing request and planning autonomous execution...',
        status: 'STREAMING',
      });

      // Execute asynchronously to avoid blocking HTTP response
      (async () => {
        try {
          if (executeAsTask) {
            // Plan execution with Gemini orchestrator
            const plan = await orchestrator.planExecution(content);

            // Create persistent task with planned worker steps
            const task = await db.createTask({
              conversationId,
              title: plan.taskTitle,
              prompt: content,
              status: 'PENDING',
              priority: 'NORMAL',
              maxRetries: 3,
              metadata: { thought: plan.thought },
              steps: plan.steps.map((s, idx) => ({
                stepIndex: idx,
                title: s.title,
                description: s.description,
                workerType: s.workerType,
                inputData: s.inputData,
              })),
            });

            // Update assistant message with plan description & link to task
            const replyText = `${plan.conversationalReply}\n\n**Task Plan:** ${plan.taskTitle}\n${plan.steps
              .map((s, i) => `${i + 1}. **[${s.workerType}]** ${s.title}`)
              .join('\n')}\n\n*Running autonomously on cloud workers. You can close your laptop safely.*`;

            await db.updateMessageContent(assistantMsg.id, replyText, 'SENT');
            wsGateway.emitChatStreamEnd(conversationId, assistantMsg.id, replyText);

            // Enqueue task for background worker execution
            await taskQueue.enqueueTask(task.id);
          } else {
            // Conversational stream only
            let accumulated = '';
            await orchestrator.streamConversationalResponse(content, [], (chunk) => {
              accumulated += chunk;
              wsGateway.emitChatStreamChunk({
                conversationId,
                messageId: assistantMsg.id,
                chunk,
                isFirst: accumulated.length === chunk.length,
              });
            });
            await db.updateMessageContent(assistantMsg.id, accumulated, 'SENT');
            wsGateway.emitChatStreamEnd(conversationId, assistantMsg.id, accumulated);
          }
        } catch (err: any) {
          console.error('[Conversations] Message processing error:', err);
          const errorMsg = `Error planning task: ${err.message}`;
          await db.updateMessageContent(assistantMsg.id, errorMsg, 'ERROR');
          wsGateway.emitChatStreamEnd(conversationId, assistantMsg.id, errorMsg);
        }
      })();

      return {
        userMessage: userMsg,
        assistantMessage: assistantMsg,
      };
    }
  );
}
