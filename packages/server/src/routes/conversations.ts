import { FastifyInstance, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
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

  // Post message to conversation (initiates AI reasoning, agent memory lookup, & autonomous planning)
  fastify.post(
    '/api/conversations/:id/messages',
    async (
      req: FastifyRequest<{
        Params: { id: string };
        Body: { content: string; executeAsTask?: boolean; agentId?: string };
      }>
    ) => {
      const { content, executeAsTask = true, agentId = 'main-orchestrator' } = req.body;
      const conversationId = req.params.id;

      // 1. Fetch the active agent and its persistent memory
      const activeAgent = (await db.getAgent(agentId)) || (await db.getAgent('main-orchestrator'));

      // 2. Save user message
      const userMsg = await db.createMessage({
        conversationId,
        role: 'user',
        content,
        status: 'SENT',
      });

      // 3. Prepare assistant message record
      const assistantMsg = await db.createMessage({
        conversationId,
        role: 'assistant',
        content: `[${activeAgent?.name || 'Nexora Brain'}] Analyzing and executing...`,
        status: 'STREAMING',
      });

      // Execute asynchronously
      (async () => {
        try {
          const isAgentCreationIntent =
            activeAgent?.isMainAgent &&
            Boolean(
              content.match(/(create|make|build|spawn|synthesize)\s+(an?\s+)?(agent|bot|worker|assistant)/i) ||
              content.match(/mujhe\s+.*(agent|bot)\s+(banao|chahiye)/i)
            );

          if (isAgentCreationIntent) {
            // Main Agent autonomously creates a new bot from user requirement!
            const prompt = `
The user asked the master agent to create a new autonomous bot with this requirement:
"${content}"

Return JSON matching:
{
  "name": "Creative Bot Name (e.g. Night Shift, Inbox Triage, Crypto Scout)",
  "description": "What this bot does for the user",
  "avatarKey": "one of: orchestrator, research, writing, image, video, browser, developer, social, operations, files",
  "colorHex": "one of: #8B5A2B, #EF4444, #F97316, #F59E0B, #10B981, #14B8A6, #3B82F6, #8B5CF6, #EC4899, #4B5563",
  "systemPrompt": "System instructions for this bot",
  "capabilities": ["RESEARCH", "WRITING"],
  "initialUserFacts": ["Fact about user intent"]
}
`;
            const raw = await orchestrator.generateRawContent(prompt);
            let parsed: any;
            try {
              parsed = JSON.parse(raw.replace(/```json/gi, '').replace(/```/g, '').trim());
            } catch {
              parsed = {
                name: 'Specialist Assistant',
                description: content.slice(0, 80),
                avatarKey: 'research',
                colorHex: '#3B82F6',
                systemPrompt: `You are an autonomous assistant created for: ${content}`,
                capabilities: ['RESEARCH', 'WRITING'],
                initialUserFacts: [`User instructed: ${content.slice(0, 60)}`],
              };
            }

            const newBotId = `bot-${uuidv4().slice(0, 8)}`;
            const now = new Date().toISOString();
            const createdBot = await db.createAgent({
              id: newBotId,
              name: parsed.name,
              description: parsed.description,
              systemPrompt: parsed.systemPrompt,
              avatarKey: parsed.avatarKey || 'research',
              colorHex: parsed.colorHex || '#3B82F6',
              capabilities: parsed.capabilities || ['RESEARCH', 'WRITING'],
              memory: {
                userFacts: parsed.initialUserFacts || ['User requested automated assistance'],
                instructions: ['Never forget user preferences', 'Execute tasks independently'],
                summary: `Autonomously synthesized by Nexora Brain for: ${content.slice(0, 80)}`,
                lastUpdated: now,
              },
              isMainAgent: false,
            });

            const replyText = `🎉 **I have synthesized a new autonomous bot for you!**\n\n- **Bot Name:** ${createdBot.name}\n- **Role:** ${createdBot.description}\n- **Mascot Avatar:** ${createdBot.avatarKey}\n- **Dedicated Memory:** Initialized and persistent\n\nYou will see **${createdBot.name}** in your sidebar. Click on it anytime to chat or inspect its brain!`;

            await db.updateMessageContent(assistantMsg.id, replyText, 'SENT');
            wsGateway.emitChatStreamEnd(conversationId, assistantMsg.id, replyText);
            return;
          }

          const isExplicitTaskDelegation = Boolean(
            content.match(/\b(scrape|crawl|ffmpeg|playwright|download|clone|npm install|git commit|execute test|run command)\b/i) ||
            content.match(/^(build|scaffold|code|create|generate|produce|render|deploy)\s+(a|an|the|this)?\s*(app|website|script|video|thumbnail|image|docker|pipeline|endpoint)\b/i)
          );

          const isConversationalQuery =
            !executeAsTask ||
            !isExplicitTaskDelegation ||
            Boolean(
              content.trim().endsWith('?') ||
              content.match(/^(hi|hello|hey|yo|greetings|hola)\b/i) ||
              content.match(/^(what|why|how|who|when|where|which|whose|can you|could you|would you|will you|tell me|explain|describe|introduce|help me)\b/i) ||
              content.match(/\b(who are you|what are you|who made you|who created you|what is your name|your name|what model|are you gemini|are you google)\b/i)
            );

          if (!isConversationalQuery && executeAsTask) {
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
              metadata: {
                thought: plan.thought,
                agentId: activeAgent?.id,
                agentName: activeAgent?.name,
              },
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
              .join('\n')}\n\n*Running autonomously on cloud workers with ${activeAgent?.name || 'Nexora Brain'}.*`;

            await db.updateMessageContent(assistantMsg.id, replyText, 'SENT');
            wsGateway.emitChatStreamEnd(conversationId, assistantMsg.id, replyText);

            // Enqueue task for background worker execution
            await taskQueue.enqueueTask(task.id);
          } else {
            // Conversational stream with agent memory
            let accumulated = '';
            await orchestrator.streamConversationalResponse(
              content,
              [],
              (chunk) => {
                accumulated += chunk;
                wsGateway.emitChatStreamChunk({
                  conversationId,
                  messageId: assistantMsg.id,
                  chunk,
                  isFirst: accumulated.length === chunk.length,
                });
              },
              {
                name: activeAgent?.name,
                systemPrompt: activeAgent?.systemPrompt,
                memoryFacts: activeAgent?.memory.userFacts,
                instructions: activeAgent?.memory.instructions,
              }
            );

            await db.updateMessageContent(assistantMsg.id, accumulated, 'SENT');
            wsGateway.emitChatStreamEnd(conversationId, assistantMsg.id, accumulated);
          }

          // Background Memory Extraction: Extract any new user preference mentioned in this turn
          if (activeAgent) {
            const memoryExtractionPrompt = `
User message: "${content}"
Current remembered facts about user:
${(activeAgent.memory.userFacts || []).map((f) => `- ${f}`).join('\n')}

Did the user share any new fact, preference, tool choice, or personal detail about themselves?
If YES, return a single concise sentence (e.g. "User works on D: drive", "User prefers dark mode").
If NO new fact was shared, return "NONE".
`;
            const extracted = await orchestrator.generateRawContent(memoryExtractionPrompt);
            const clean = extracted.trim();
            if (clean && !clean.toUpperCase().includes('NONE') && clean.length > 5 && clean.length < 150) {
              await db.updateAgentMemory(activeAgent.id, {
                userFacts: [...(activeAgent.memory.userFacts || []), clean],
              });
              console.log(`[Memory] Updated ${activeAgent.name}'s memory with fact: "${clean}"`);
            }
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
