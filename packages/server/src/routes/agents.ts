import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { geminiOrchestrator } from '../orchestrator/gemini.js';
import { CustomAgent, CreateAgentDto, GenerateAgentDto } from '@nexora/shared';

export async function agentRoutes(app: FastifyInstance) {
  // 1. List all custom agents (auto-seeds main agent if empty)
  app.get('/api/agents', async () => {
    const agents = await db.listAgents();
    return { agents };
  });

  // 2. Get specific agent by ID
  app.get<{ Params: { id: string } }>('/api/agents/:id', async (req, reply) => {
    const agent = await db.getAgent(req.params.id);
    if (!agent) {
      return reply.status(404).send({ error: 'Agent not found' });
    }
    return { agent };
  });

  // 3. Create agent manually from studio
  app.post<{ Body: CreateAgentDto }>('/api/agents', async (req, reply) => {
    const { name, description, systemPrompt, avatarKey, colorHex, capabilities, initialFacts } = req.body;
    if (!name || !name.trim()) {
      return reply.status(400).send({ error: 'Agent name is required' });
    }

    const id = `bot-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    const agent: Omit<CustomAgent, 'createdAt' | 'updatedAt'> = {
      id,
      name: name.trim(),
      description: description?.trim() || 'Custom autonomous desktop assistant',
      systemPrompt:
        systemPrompt?.trim() ||
        `You are ${name.trim()}, a specialized autonomous personal assistant created to help the user. Always be proactive, accurate, and execute tasks thoroughly.`,
      avatarKey: avatarKey || 'orchestrator',
      colorHex: colorHex || '#3B82F6',
      capabilities: capabilities || ['RESEARCH', 'WRITING'],
      memory: {
        userFacts: initialFacts || ['User prefers clear, high quality answers'],
        instructions: ['Follow user tone and preferences', 'Remember context across tasks'],
        summary: `${name.trim()} initialized.`,
        lastUpdated: now,
      },
      isMainAgent: false,
    };

    const created = await db.createAgent(agent);
    return reply.status(201).send({ agent: created });
  });

  // 4. Autonomous Agent Generation by Main Agent (Nexora Brain)
  app.post<{ Body: GenerateAgentDto }>('/api/agents/generate', async (req, reply) => {
    const { userRequirement } = req.body;
    if (!userRequirement || !userRequirement.trim()) {
      return reply.status(400).send({ error: 'userRequirement is required' });
    }

    try {
      const prompt = `
You are Nexora Brain, the master autonomous AI orchestrator.
The user wants to create a new specialized autonomous bot/agent with this requirement:
"${userRequirement.trim()}"

Analyze the requirement and synthesize a tailored autonomous bot.
Select the best matching avatarKey from this exact list:
['orchestrator', 'research', 'writing', 'image', 'video', 'browser', 'developer', 'social', 'operations', 'files']

Select the best colorHex from this exact list of 10 palette colors:
['#8B5A2B', '#EF4444', '#F97316', '#F59E0B', '#10B981', '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899', '#4B5563']

Select relevant capabilities from:
['BROWSER', 'CODE_RUNNER', 'RESEARCH', 'WRITING', 'IMAGE_GEN', 'VIDEO_OPS', 'SOCIAL_OPS']

Return ONLY valid JSON matching this schema:
{
  "name": "Short creative bot name (e.g. Night Shift, Inbox Triage, Code Spark)",
  "description": "One sentence summary of what this bot does for the user",
  "avatarKey": "one of the avatar keys above",
  "colorHex": "one of the 10 hex codes above",
  "systemPrompt": "Detailed system prompt instructions telling the bot how to behave, its tone, and its domain expertise",
  "capabilities": ["capability1", "capability2"],
  "initialUserFacts": ["Key inferred user preference 1", "Key inferred user preference 2"]
}
`;

      const aiResponse = await geminiOrchestrator.generateRawContent(prompt);
      let parsed: any;
      try {
        const cleanJson = aiResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleanJson);
      } catch {
        parsed = {
          name: 'Specialist Bot',
          description: userRequirement.slice(0, 80),
          avatarKey: 'research',
          colorHex: '#3B82F6',
          systemPrompt: `You are a specialist assistant designed for: ${userRequirement}.`,
          capabilities: ['RESEARCH', 'WRITING'],
          initialUserFacts: [`User requested assistance with: ${userRequirement.slice(0, 60)}`],
        };
      }

      const id = `bot-${uuidv4().slice(0, 8)}`;
      const now = new Date().toISOString();

      const newAgent: Omit<CustomAgent, 'createdAt' | 'updatedAt'> = {
        id,
        name: parsed.name || 'Assistant Bot',
        description: parsed.description || userRequirement.slice(0, 100),
        systemPrompt: parsed.systemPrompt || `You are an autonomous assistant created for ${userRequirement}.`,
        avatarKey: parsed.avatarKey || 'research',
        colorHex: parsed.colorHex || '#3B82F6',
        capabilities: parsed.capabilities || ['RESEARCH', 'WRITING'],
        memory: {
          userFacts: parsed.initialUserFacts || ['User prefers tailored, automated assistance'],
          instructions: ['Never forget user preferences', 'Execute tasks independently'],
          summary: `Synthesized by Nexora Brain for: ${userRequirement.slice(0, 80)}`,
          lastUpdated: now,
        },
        isMainAgent: false,
      };

      const created = await db.createAgent(newAgent);
      return reply.status(201).send({ agent: created });
    } catch (err: any) {
      return reply.status(500).send({ error: 'Failed to synthesize agent: ' + err.message });
    }
  });

  // 5. Update agent details
  app.put<{ Params: { id: string }; Body: Partial<CustomAgent> }>('/api/agents/:id', async (req, reply) => {
    const updated = await db.updateAgent(req.params.id, req.body);
    if (!updated) {
      return reply.status(404).send({ error: 'Agent not found' });
    }
    return { agent: updated };
  });

  // 6. Delete agent (main agent protected)
  app.delete<{ Params: { id: string } }>('/api/agents/:id', async (req, reply) => {
    const agent = await db.getAgent(req.params.id);
    if (agent?.isMainAgent) {
      return reply.status(400).send({ error: 'Cannot delete the Main Agent' });
    }
    await db.deleteAgent(req.params.id);
    return { success: true };
  });

  // 7. Get Agent Memory
  app.get<{ Params: { id: string } }>('/api/agents/:id/memory', async (req, reply) => {
    const agent = await db.getAgent(req.params.id);
    if (!agent) {
      return reply.status(404).send({ error: 'Agent not found' });
    }
    return { memory: agent.memory };
  });

  // 8. Update Agent Memory (append/edit facts so bot never forgets)
  app.post<{ Params: { id: string }; Body: { fact?: string; removeFact?: string; userFacts?: string[]; instructions?: string[] } }>(
    '/api/agents/:id/memory',
    async (req, reply) => {
      const agent = await db.getAgent(req.params.id);
      if (!agent) {
        return reply.status(404).send({ error: 'Agent not found' });
      }

      let userFacts = req.body.userFacts ? [...req.body.userFacts] : [...(agent.memory.userFacts || [])];
      if (req.body.fact && !userFacts.includes(req.body.fact.trim())) {
        userFacts.push(req.body.fact.trim());
      }
      if (req.body.removeFact) {
        userFacts = userFacts.filter((f) => f !== req.body.removeFact);
      }

      const instructions = req.body.instructions || agent.memory.instructions;

      const updatedMemory = await db.updateAgentMemory(req.params.id, {
        userFacts,
        instructions,
        lastUpdated: new Date().toISOString(),
      });

      return { memory: updatedMemory };
    }
  );
}
