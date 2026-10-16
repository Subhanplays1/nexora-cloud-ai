import { DatabaseSync } from 'node:sqlite';
import pg from 'pg';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
class SQLiteDatabaseService {
    db;
    constructor() {
        const dbPath = path.join(config.dataDir, 'nexora.db');
        this.db = new DatabaseSync(dbPath);
    }
    async init() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        attachments_json TEXT,
        task_id TEXT,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        progress_percent REAL NOT NULL DEFAULT 0,
        current_step_index INTEGER NOT NULL DEFAULT 0,
        retry_count INTEGER NOT NULL DEFAULT 0,
        max_retries INTEGER NOT NULL DEFAULT 3,
        idempotency_key TEXT,
        metadata_json TEXT,
        result_summary TEXT,
        error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS task_steps (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        step_index INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        worker_type TEXT NOT NULL,
        status TEXT NOT NULL,
        logs_json TEXT NOT NULL DEFAULT '[]',
        screenshot_url TEXT,
        terminal_output TEXT,
        input_data_json TEXT,
        output_data_json TEXT,
        error TEXT,
        started_at TEXT,
        completed_at TEXT
      );

      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        step_id TEXT NOT NULL,
        worker_type TEXT NOT NULL,
        action_name TEXT NOT NULL,
        description TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        status TEXT NOT NULL,
        reason TEXT,
        created_at TEXT NOT NULL,
        responded_at TEXT,
        responded_by TEXT
      );

      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        step_id TEXT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        path TEXT NOT NULL,
        url TEXT NOT NULL,
        size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        metadata_json TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        system_prompt TEXT NOT NULL,
        avatar_key TEXT NOT NULL,
        color_hex TEXT NOT NULL,
        capabilities_json TEXT NOT NULL,
        memory_json TEXT NOT NULL,
        is_main INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    }
    async listConversations() {
        const rows = this.db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC').all();
        return rows.map((r) => ({
            id: r.id,
            title: r.title,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            messages: [],
        }));
    }
    async getConversation(id) {
        const conv = this.db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
        if (!conv)
            return null;
        const messages = await this.listMessages(id);
        return {
            id: conv.id,
            title: conv.title,
            createdAt: conv.created_at,
            updatedAt: conv.updated_at,
            messages,
            lastMessageSnippet: messages[messages.length - 1]?.content.slice(0, 80),
        };
    }
    async createConversation(title = 'New Task Chat') {
        const now = new Date().toISOString();
        const id = uuidv4();
        this.db.prepare('INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)').run(id, title, now, now);
        return {
            id,
            title,
            createdAt: now,
            updatedAt: now,
            messages: [],
        };
    }
    async deleteConversation(id) {
        this.db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id);
        this.db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
    }
    async listMessages(conversationId) {
        const rows = this.db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversationId);
        return rows.map((r) => ({
            id: r.id,
            conversationId: r.conversation_id,
            role: r.role,
            content: r.content,
            attachments: r.attachments_json ? JSON.parse(r.attachments_json) : undefined,
            taskId: r.task_id || undefined,
            status: r.status,
            createdAt: r.created_at,
        }));
    }
    async createMessage(msg) {
        const id = uuidv4();
        const now = new Date().toISOString();
        this.db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, attachments_json, task_id, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, msg.conversationId, msg.role, msg.content, msg.attachments ? JSON.stringify(msg.attachments) : null, msg.taskId || null, msg.status, now);
        // update conversation timestamp
        this.db.prepare('UPDATE conversations SET updated_at = ? WHERE id = ?').run(now, msg.conversationId);
        return {
            ...msg,
            id,
            createdAt: now,
        };
    }
    async updateMessageContent(id, content, status) {
        if (status) {
            this.db.prepare('UPDATE messages SET content = ?, status = ? WHERE id = ?').run(content, status, id);
        }
        else {
            this.db.prepare('UPDATE messages SET content = ? WHERE id = ?').run(content, id);
        }
    }
    mapTask(row, steps) {
        return {
            id: row.id,
            conversationId: row.conversation_id || undefined,
            title: row.title,
            prompt: row.prompt,
            status: row.status,
            priority: row.priority,
            progressPercent: row.progress_percent,
            currentStepIndex: row.current_step_index,
            retryCount: row.retry_count,
            maxRetries: row.max_retries,
            idempotencyKey: row.idempotency_key || undefined,
            metadata: row.metadata_json ? JSON.parse(row.metadata_json) : undefined,
            resultSummary: row.result_summary || undefined,
            error: row.error || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            startedAt: row.started_at || undefined,
            completedAt: row.completed_at || undefined,
            steps,
        };
    }
    mapStep(row) {
        return {
            id: row.id,
            taskId: row.task_id,
            stepIndex: row.step_index,
            title: row.title,
            description: row.description || undefined,
            workerType: row.worker_type,
            status: row.status,
            logs: row.logs_json ? JSON.parse(row.logs_json) : [],
            screenshotUrl: row.screenshot_url || undefined,
            terminalOutput: row.terminal_output || undefined,
            inputData: row.input_data_json ? JSON.parse(row.input_data_json) : undefined,
            outputData: row.output_data_json ? JSON.parse(row.output_data_json) : undefined,
            error: row.error || undefined,
            startedAt: row.started_at || undefined,
            completedAt: row.completed_at || undefined,
        };
    }
    async listTasks(limit = 50) {
        const rows = this.db.prepare('SELECT * FROM tasks ORDER BY created_at DESC LIMIT ?').all(limit);
        const tasks = [];
        for (const r of rows) {
            const stepRows = this.db.prepare('SELECT * FROM task_steps WHERE task_id = ? ORDER BY step_index ASC').all(r.id);
            tasks.push(this.mapTask(r, stepRows.map(this.mapStep)));
        }
        return tasks;
    }
    async getTask(id) {
        const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
        if (!row)
            return null;
        const stepRows = this.db.prepare('SELECT * FROM task_steps WHERE task_id = ? ORDER BY step_index ASC').all(id);
        return this.mapTask(row, stepRows.map(this.mapStep));
    }
    async createTask(input) {
        const id = uuidv4();
        const now = new Date().toISOString();
        this.db.prepare(`
      INSERT INTO tasks (
        id, conversation_id, title, prompt, status, priority, progress_percent,
        current_step_index, retry_count, max_retries, idempotency_key, metadata_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, input.conversationId || null, input.title, input.prompt, input.status || 'PENDING', input.priority || 'NORMAL', 0, 0, 0, input.maxRetries ?? 3, input.idempotencyKey || null, input.metadata ? JSON.stringify(input.metadata) : null, now, now);
        const createdSteps = [];
        for (let i = 0; i < input.steps.length; i++) {
            const s = input.steps[i];
            const stepId = uuidv4();
            this.db.prepare(`
        INSERT INTO task_steps (
          id, task_id, step_index, title, description, worker_type, status,
          logs_json, input_data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(stepId, id, i, s.title, s.description || null, s.workerType, 'PENDING', '[]', s.inputData ? JSON.stringify(s.inputData) : null);
            createdSteps.push({
                id: stepId,
                taskId: id,
                stepIndex: i,
                title: s.title,
                description: s.description,
                workerType: s.workerType,
                status: 'PENDING',
                logs: [],
                inputData: s.inputData,
            });
        }
        return (await this.getTask(id));
    }
    async updateTask(id, updates) {
        const now = new Date().toISOString();
        const fields = ['updated_at = ?'];
        const values = [now];
        if (updates.status !== undefined) {
            fields.push('status = ?');
            values.push(updates.status);
        }
        if (updates.progressPercent !== undefined) {
            fields.push('progress_percent = ?');
            values.push(updates.progressPercent);
        }
        if (updates.currentStepIndex !== undefined) {
            fields.push('current_step_index = ?');
            values.push(updates.currentStepIndex);
        }
        if (updates.retryCount !== undefined) {
            fields.push('retry_count = ?');
            values.push(updates.retryCount);
        }
        if (updates.resultSummary !== undefined) {
            fields.push('result_summary = ?');
            values.push(updates.resultSummary);
        }
        if (updates.error !== undefined) {
            fields.push('error = ?');
            values.push(updates.error);
        }
        if (updates.startedAt !== undefined) {
            fields.push('started_at = ?');
            values.push(updates.startedAt);
        }
        if (updates.completedAt !== undefined) {
            fields.push('completed_at = ?');
            values.push(updates.completedAt);
        }
        values.push(id);
        this.db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        return this.getTask(id);
    }
    async getInterruptedTasks() {
        const rows = this.db.prepare(`
      SELECT * FROM tasks
      WHERE status IN ('RUNNING', 'QUEUED', 'RETRYING')
      ORDER BY created_at ASC
    `).all();
        const tasks = [];
        for (const r of rows) {
            const stepRows = this.db.prepare('SELECT * FROM task_steps WHERE task_id = ? ORDER BY step_index ASC').all(r.id);
            tasks.push(this.mapTask(r, stepRows.map(this.mapStep)));
        }
        return tasks;
    }
    async updateTaskStep(id, updates) {
        const fields = [];
        const values = [];
        if (updates.status !== undefined) {
            fields.push('status = ?');
            values.push(updates.status);
        }
        if (updates.screenshotUrl !== undefined) {
            fields.push('screenshot_url = ?');
            values.push(updates.screenshotUrl);
        }
        if (updates.terminalOutput !== undefined) {
            fields.push('terminal_output = ?');
            values.push(updates.terminalOutput);
        }
        if (updates.error !== undefined) {
            fields.push('error = ?');
            values.push(updates.error);
        }
        if (updates.startedAt !== undefined) {
            fields.push('started_at = ?');
            values.push(updates.startedAt);
        }
        if (updates.completedAt !== undefined) {
            fields.push('completed_at = ?');
            values.push(updates.completedAt);
        }
        if (updates.outputData !== undefined) {
            fields.push('output_data_json = ?');
            values.push(JSON.stringify(updates.outputData));
        }
        if (fields.length === 0)
            return null;
        values.push(id);
        this.db.prepare(`UPDATE task_steps SET ${fields.join(', ')} WHERE id = ?`).run(...values);
        const updated = this.db.prepare('SELECT * FROM task_steps WHERE id = ?').get(id);
        return updated ? this.mapStep(updated) : null;
    }
    async appendTaskStepLog(id, logLine) {
        const step = this.db.prepare('SELECT logs_json FROM task_steps WHERE id = ?').get(id);
        if (!step)
            return;
        const logs = step.logs_json ? JSON.parse(step.logs_json) : [];
        logs.push(logLine);
        this.db.prepare('UPDATE task_steps SET logs_json = ? WHERE id = ?').run(JSON.stringify(logs), id);
    }
    async listPendingApprovals() {
        const rows = this.db.prepare(`
      SELECT * FROM approvals WHERE status = 'PENDING' ORDER BY created_at ASC
    `).all();
        return rows.map((r) => ({
            id: r.id,
            taskId: r.task_id,
            stepId: r.step_id,
            workerType: r.worker_type,
            actionName: r.action_name,
            description: r.description,
            parameters: JSON.parse(r.parameters_json),
            riskLevel: r.risk_level,
            status: r.status,
            reason: r.reason || undefined,
            createdAt: r.created_at,
            respondedAt: r.responded_at || undefined,
            respondedBy: r.responded_by || undefined,
        }));
    }
    async createApproval(app) {
        const id = uuidv4();
        const now = new Date().toISOString();
        this.db.prepare(`
      INSERT INTO approvals (
        id, task_id, step_id, worker_type, action_name, description,
        parameters_json, risk_level, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, app.taskId, app.stepId, app.workerType, app.actionName, app.description, JSON.stringify(app.parameters), app.riskLevel, 'PENDING', now);
        return {
            ...app,
            id,
            status: 'PENDING',
            createdAt: now,
        };
    }
    async resolveApproval(id, status, respondedBy = 'user', reason) {
        const now = new Date().toISOString();
        this.db.prepare(`
      UPDATE approvals
      SET status = ?, responded_at = ?, responded_by = ?, reason = ?
      WHERE id = ?
    `).run(status, now, respondedBy, reason || null, id);
        const row = this.db.prepare('SELECT * FROM approvals WHERE id = ?').get(id);
        if (!row)
            return null;
        return {
            id: row.id,
            taskId: row.task_id,
            stepId: row.step_id,
            workerType: row.worker_type,
            actionName: row.action_name,
            description: row.description,
            parameters: JSON.parse(row.parameters_json),
            riskLevel: row.risk_level,
            status: row.status,
            reason: row.reason || undefined,
            createdAt: row.created_at,
            respondedAt: row.responded_at,
            respondedBy: row.responded_by,
        };
    }
    async listArtifacts(taskId) {
        const query = taskId
            ? 'SELECT * FROM artifacts WHERE task_id = ? ORDER BY created_at DESC'
            : 'SELECT * FROM artifacts ORDER BY created_at DESC LIMIT 100';
        const rows = (taskId ? this.db.prepare(query).all(taskId) : this.db.prepare(query).all());
        return rows.map((r) => ({
            id: r.id,
            taskId: r.task_id,
            stepId: r.step_id || undefined,
            name: r.name,
            type: r.type,
            path: r.path,
            url: r.url,
            size: r.size,
            mimeType: r.mime_type,
            metadata: r.metadata_json ? JSON.parse(r.metadata_json) : undefined,
            createdAt: r.created_at,
        }));
    }
    async createArtifact(art) {
        const id = uuidv4();
        const now = new Date().toISOString();
        this.db.prepare(`
      INSERT INTO artifacts (
        id, task_id, step_id, name, type, path, url, size, mime_type, metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, art.taskId, art.stepId || null, art.name, art.type, art.path, art.url, art.size, art.mimeType, art.metadata ? JSON.stringify(art.metadata) : null, now);
        return {
            ...art,
            id,
            createdAt: now,
        };
    }
    async getSetting(key, defaultValue) {
        const row = this.db.prepare('SELECT value_json FROM settings WHERE key = ?').get(key);
        if (!row)
            return defaultValue;
        try {
            return JSON.parse(row.value_json);
        }
        catch {
            return defaultValue;
        }
    }
    async setSetting(key, value) {
        const now = new Date().toISOString();
        this.db.prepare(`
      INSERT INTO settings (key, value_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `).run(key, JSON.stringify(value), now);
    }
    getDefaultMainAgent() {
        const now = new Date().toISOString();
        return {
            id: 'main-orchestrator',
            name: 'Nexora Brain',
            description: 'Autonomous Task Orchestrator & Multi-Agent Synthesizer. Tell me what you need and I will plan, execute, or build specialized bots for you.',
            systemPrompt: 'You are Nexora Brain, the master autonomous orchestrator and bot architect. You plan, execute, coordinate tasks, and synthesize specialized custom agents for the user.',
            avatarKey: 'orchestrator',
            colorHex: '#3B82F6',
            capabilities: ['ORCHESTRATOR', 'RESEARCH', 'WRITING', 'IMAGE_GEN', 'BROWSER', 'CODE_RUNNER'],
            memory: {
                userFacts: [
                    'User name: Subhan Zahid',
                    'Platform: Nexora AI Personal Cloud Desktop Agent',
                    'Preferences: Fast execution, persistent background cloud jobs, high retention quality',
                ],
                instructions: [
                    'Always prioritize persistent cloud execution',
                    'Create specialized bots when requested by user',
                    'Remember all facts the user teaches you',
                ],
                summary: 'Nexora Brain master orchestrator initialized for Subhan Zahid.',
                lastUpdated: now,
            },
            isMainAgent: true,
            createdAt: now,
            updatedAt: now,
        };
    }
    mapSqliteAgent(row) {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            systemPrompt: row.system_prompt,
            avatarKey: row.avatar_key,
            colorHex: row.color_hex,
            capabilities: row.capabilities_json ? JSON.parse(row.capabilities_json) : [],
            memory: row.memory_json ? JSON.parse(row.memory_json) : { userFacts: [], instructions: [], summary: '', lastUpdated: row.updated_at },
            isMainAgent: Boolean(row.is_main),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
    async listAgents() {
        const rows = this.db.prepare('SELECT * FROM agents ORDER BY is_main DESC, created_at ASC').all();
        if (rows.length === 0) {
            const defaultAgent = this.getDefaultMainAgent();
            await this.createAgent(defaultAgent);
            return [defaultAgent];
        }
        return rows.map((r) => this.mapSqliteAgent(r));
    }
    async getAgent(id) {
        const row = this.db.prepare('SELECT * FROM agents WHERE id = ?').get(id);
        if (!row)
            return null;
        return this.mapSqliteAgent(row);
    }
    async createAgent(agent) {
        const now = new Date().toISOString();
        const fullAgent = {
            ...agent,
            createdAt: now,
            updatedAt: now,
        };
        this.db.prepare(`
      INSERT INTO agents (
        id, name, description, system_prompt, avatar_key, color_hex, capabilities_json, memory_json, is_main, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(fullAgent.id, fullAgent.name, fullAgent.description, fullAgent.systemPrompt, fullAgent.avatarKey, fullAgent.colorHex, JSON.stringify(fullAgent.capabilities || []), JSON.stringify(fullAgent.memory), fullAgent.isMainAgent ? 1 : 0, fullAgent.createdAt, fullAgent.updatedAt);
        return fullAgent;
    }
    async updateAgent(id, updates) {
        const existing = await this.getAgent(id);
        if (!existing)
            return null;
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        this.db.prepare(`
      UPDATE agents SET
        name = ?, description = ?, system_prompt = ?, avatar_key = ?, color_hex = ?, capabilities_json = ?, memory_json = ?, updated_at = ?
      WHERE id = ?
    `).run(updated.name, updated.description, updated.systemPrompt, updated.avatarKey, updated.colorHex, JSON.stringify(updated.capabilities || []), JSON.stringify(updated.memory), updated.updatedAt, id);
        return updated;
    }
    async deleteAgent(id) {
        this.db.prepare('DELETE FROM agents WHERE id = ? AND is_main = 0').run(id);
    }
    async updateAgentMemory(id, memoryUpdates) {
        const agent = await this.getAgent(id);
        if (!agent)
            return null;
        const newMemory = {
            userFacts: memoryUpdates.userFacts ?? agent.memory.userFacts ?? [],
            instructions: memoryUpdates.instructions ?? agent.memory.instructions ?? [],
            summary: memoryUpdates.summary ?? agent.memory.summary ?? '',
            lastUpdated: new Date().toISOString(),
        };
        await this.updateAgent(id, { memory: newMemory });
        return newMemory;
    }
}
// PostgreSQL Implementation for VPS / Production
class PostgresDatabaseService {
    pool;
    constructor(connectionString) {
        this.pool = new pg.Pool({ connectionString });
    }
    async init() {
        await this.pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(64) PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(64) PRIMARY KEY,
        conversation_id VARCHAR(64) NOT NULL,
        role VARCHAR(32) NOT NULL,
        content TEXT NOT NULL,
        attachments_json TEXT,
        task_id VARCHAR(64),
        status VARCHAR(32) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id VARCHAR(64) PRIMARY KEY,
        conversation_id VARCHAR(64),
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        status VARCHAR(32) NOT NULL,
        priority VARCHAR(32) NOT NULL,
        progress_percent REAL NOT NULL DEFAULT 0,
        current_step_index INT NOT NULL DEFAULT 0,
        retry_count INT NOT NULL DEFAULT 0,
        max_retries INT NOT NULL DEFAULT 3,
        idempotency_key VARCHAR(128),
        metadata_json TEXT,
        result_summary TEXT,
        error TEXT,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS task_steps (
        id VARCHAR(64) PRIMARY KEY,
        task_id VARCHAR(64) NOT NULL,
        step_index INT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        worker_type VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL,
        logs_json TEXT NOT NULL DEFAULT '[]',
        screenshot_url TEXT,
        terminal_output TEXT,
        input_data_json TEXT,
        output_data_json TEXT,
        error TEXT,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS approvals (
        id VARCHAR(64) PRIMARY KEY,
        task_id VARCHAR(64) NOT NULL,
        step_id VARCHAR(64) NOT NULL,
        worker_type VARCHAR(64) NOT NULL,
        action_name TEXT NOT NULL,
        description TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        risk_level VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL,
        reason TEXT,
        created_at TIMESTAMPTZ NOT NULL,
        responded_at TIMESTAMPTZ,
        responded_by VARCHAR(64)
      );

      CREATE TABLE IF NOT EXISTS artifacts (
        id VARCHAR(64) PRIMARY KEY,
        task_id VARCHAR(64) NOT NULL,
        step_id VARCHAR(64),
        name TEXT NOT NULL,
        type VARCHAR(32) NOT NULL,
        path TEXT NOT NULL,
        url TEXT NOT NULL,
        size BIGINT NOT NULL,
        mime_type VARCHAR(128) NOT NULL,
        metadata_json TEXT,
        created_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(128) PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );

      CREATE TABLE IF NOT EXISTS agents (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        system_prompt TEXT NOT NULL,
        avatar_key VARCHAR(64) NOT NULL,
        color_hex VARCHAR(32) NOT NULL,
        capabilities_json TEXT NOT NULL,
        memory_json TEXT NOT NULL,
        is_main BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    }
    // Postgres proxy fallback methods forwarding to sqlite schema or pool queries
    // For production VPS, the pool is active.
    async listConversations() {
        const res = await this.pool.query('SELECT * FROM conversations ORDER BY updated_at DESC');
        return res.rows.map((r) => ({
            id: r.id,
            title: r.title,
            createdAt: r.created_at.toISOString(),
            updatedAt: r.updated_at.toISOString(),
            messages: [],
        }));
    }
    async getConversation(id) {
        const res = await this.pool.query('SELECT * FROM conversations WHERE id = $1', [id]);
        if (res.rows.length === 0)
            return null;
        const conv = res.rows[0];
        const messages = await this.listMessages(id);
        return {
            id: conv.id,
            title: conv.title,
            createdAt: conv.created_at.toISOString(),
            updatedAt: conv.updated_at.toISOString(),
            messages,
            lastMessageSnippet: messages[messages.length - 1]?.content.slice(0, 80),
        };
    }
    async createConversation(title = 'New Task Chat') {
        const now = new Date();
        const id = uuidv4();
        await this.pool.query('INSERT INTO conversations (id, title, created_at, updated_at) VALUES ($1, $2, $3, $4)', [id, title, now, now]);
        return { id, title, createdAt: now.toISOString(), updatedAt: now.toISOString(), messages: [] };
    }
    async deleteConversation(id) {
        await this.pool.query('DELETE FROM messages WHERE conversation_id = $1', [id]);
        await this.pool.query('DELETE FROM conversations WHERE id = $1', [id]);
    }
    async listMessages(conversationId) {
        const res = await this.pool.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC', [conversationId]);
        return res.rows.map((r) => ({
            id: r.id,
            conversationId: r.conversation_id,
            role: r.role,
            content: r.content,
            attachments: r.attachments_json ? JSON.parse(r.attachments_json) : undefined,
            taskId: r.task_id || undefined,
            status: r.status,
            createdAt: r.created_at.toISOString(),
        }));
    }
    async createMessage(msg) {
        const id = uuidv4();
        const now = new Date();
        await this.pool.query(`
      INSERT INTO messages (id, conversation_id, role, content, attachments_json, task_id, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
            id,
            msg.conversationId,
            msg.role,
            msg.content,
            msg.attachments ? JSON.stringify(msg.attachments) : null,
            msg.taskId || null,
            msg.status,
            now,
        ]);
        await this.pool.query('UPDATE conversations SET updated_at = $1 WHERE id = $2', [now, msg.conversationId]);
        return { ...msg, id, createdAt: now.toISOString() };
    }
    async updateMessageContent(id, content, status) {
        if (status) {
            await this.pool.query('UPDATE messages SET content = $1, status = $2 WHERE id = $3', [content, status, id]);
        }
        else {
            await this.pool.query('UPDATE messages SET content = $1 WHERE id = $2', [content, id]);
        }
    }
    async listTasks(limit = 50) {
        const res = await this.pool.query('SELECT * FROM tasks ORDER BY created_at DESC LIMIT $1', [limit]);
        const tasks = [];
        for (const r of res.rows) {
            const stepRes = await this.pool.query('SELECT * FROM task_steps WHERE task_id = $1 ORDER BY step_index ASC', [r.id]);
            tasks.push(this.mapPgTask(r, stepRes.rows.map(this.mapPgStep)));
        }
        return tasks;
    }
    async getTask(id) {
        const res = await this.pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
        if (res.rows.length === 0)
            return null;
        const stepRes = await this.pool.query('SELECT * FROM task_steps WHERE task_id = $1 ORDER BY step_index ASC', [id]);
        return this.mapPgTask(res.rows[0], stepRes.rows.map(this.mapPgStep));
    }
    async createTask(input) {
        const id = uuidv4();
        const now = new Date();
        await this.pool.query(`
      INSERT INTO tasks (
        id, conversation_id, title, prompt, status, priority, progress_percent,
        current_step_index, retry_count, max_retries, idempotency_key, metadata_json,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
            id,
            input.conversationId || null,
            input.title,
            input.prompt,
            input.status || 'PENDING',
            input.priority || 'NORMAL',
            0,
            0,
            0,
            input.maxRetries ?? 3,
            input.idempotencyKey || null,
            input.metadata ? JSON.stringify(input.metadata) : null,
            now,
            now,
        ]);
        for (let i = 0; i < input.steps.length; i++) {
            const s = input.steps[i];
            const stepId = uuidv4();
            await this.pool.query(`
        INSERT INTO task_steps (
          id, task_id, step_index, title, description, worker_type, status,
          logs_json, input_data_json
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
                stepId,
                id,
                i,
                s.title,
                s.description || null,
                s.workerType,
                'PENDING',
                '[]',
                s.inputData ? JSON.stringify(s.inputData) : null,
            ]);
        }
        return (await this.getTask(id));
    }
    async updateTask(id, updates) {
        const now = new Date();
        const fields = ['updated_at = $1'];
        const values = [now];
        let idx = 2;
        if (updates.status !== undefined) {
            fields.push(`status = $${idx++}`);
            values.push(updates.status);
        }
        if (updates.progressPercent !== undefined) {
            fields.push(`progress_percent = $${idx++}`);
            values.push(updates.progressPercent);
        }
        if (updates.currentStepIndex !== undefined) {
            fields.push(`current_step_index = $${idx++}`);
            values.push(updates.currentStepIndex);
        }
        if (updates.retryCount !== undefined) {
            fields.push(`retry_count = $${idx++}`);
            values.push(updates.retryCount);
        }
        if (updates.resultSummary !== undefined) {
            fields.push(`result_summary = $${idx++}`);
            values.push(updates.resultSummary);
        }
        if (updates.error !== undefined) {
            fields.push(`error = $${idx++}`);
            values.push(updates.error);
        }
        if (updates.startedAt !== undefined) {
            fields.push(`started_at = $${idx++}`);
            values.push(updates.startedAt);
        }
        if (updates.completedAt !== undefined) {
            fields.push(`completed_at = $${idx++}`);
            values.push(updates.completedAt);
        }
        values.push(id);
        await this.pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = $${idx}`, values);
        return this.getTask(id);
    }
    async getInterruptedTasks() {
        const res = await this.pool.query(`
      SELECT * FROM tasks
      WHERE status IN ('RUNNING', 'QUEUED', 'RETRYING')
      ORDER BY created_at ASC
    `);
        const tasks = [];
        for (const r of res.rows) {
            const stepRes = await this.pool.query('SELECT * FROM task_steps WHERE task_id = $1 ORDER BY step_index ASC', [r.id]);
            tasks.push(this.mapPgTask(r, stepRes.rows.map(this.mapPgStep)));
        }
        return tasks;
    }
    async updateTaskStep(id, updates) {
        const fields = [];
        const values = [];
        let idx = 1;
        if (updates.status !== undefined) {
            fields.push(`status = $${idx++}`);
            values.push(updates.status);
        }
        if (updates.screenshotUrl !== undefined) {
            fields.push(`screenshot_url = $${idx++}`);
            values.push(updates.screenshotUrl);
        }
        if (updates.terminalOutput !== undefined) {
            fields.push(`terminal_output = $${idx++}`);
            values.push(updates.terminalOutput);
        }
        if (updates.error !== undefined) {
            fields.push(`error = $${idx++}`);
            values.push(updates.error);
        }
        if (updates.startedAt !== undefined) {
            fields.push(`started_at = $${idx++}`);
            values.push(updates.startedAt);
        }
        if (updates.completedAt !== undefined) {
            fields.push(`completed_at = $${idx++}`);
            values.push(updates.completedAt);
        }
        if (updates.outputData !== undefined) {
            fields.push(`output_data_json = $${idx++}`);
            values.push(JSON.stringify(updates.outputData));
        }
        if (fields.length === 0)
            return null;
        values.push(id);
        await this.pool.query(`UPDATE task_steps SET ${fields.join(', ')} WHERE id = $${idx}`, values);
        const updated = await this.pool.query('SELECT * FROM task_steps WHERE id = $1', [id]);
        return updated.rows.length ? this.mapPgStep(updated.rows[0]) : null;
    }
    async appendTaskStepLog(id, logLine) {
        const res = await this.pool.query('SELECT logs_json FROM task_steps WHERE id = $1', [id]);
        if (res.rows.length === 0)
            return;
        const logs = res.rows[0].logs_json ? JSON.parse(res.rows[0].logs_json) : [];
        logs.push(logLine);
        await this.pool.query('UPDATE task_steps SET logs_json = $1 WHERE id = $2', [JSON.stringify(logs), id]);
    }
    async listPendingApprovals() {
        const res = await this.pool.query("SELECT * FROM approvals WHERE status = 'PENDING' ORDER BY created_at ASC");
        return res.rows.map((r) => ({
            id: r.id,
            taskId: r.task_id,
            stepId: r.step_id,
            workerType: r.worker_type,
            actionName: r.action_name,
            description: r.description,
            parameters: JSON.parse(r.parameters_json),
            riskLevel: r.risk_level,
            status: r.status,
            reason: r.reason || undefined,
            createdAt: r.created_at.toISOString(),
            respondedAt: r.responded_at ? r.responded_at.toISOString() : undefined,
            respondedBy: r.responded_by || undefined,
        }));
    }
    async createApproval(app) {
        const id = uuidv4();
        const now = new Date();
        await this.pool.query(`
      INSERT INTO approvals (
        id, task_id, step_id, worker_type, action_name, description,
        parameters_json, risk_level, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
            id,
            app.taskId,
            app.stepId,
            app.workerType,
            app.actionName,
            app.description,
            JSON.stringify(app.parameters),
            app.riskLevel,
            'PENDING',
            now,
        ]);
        return { ...app, id, status: 'PENDING', createdAt: now.toISOString() };
    }
    async resolveApproval(id, status, respondedBy = 'user', reason) {
        const now = new Date();
        await this.pool.query(`
      UPDATE approvals
      SET status = $1, responded_at = $2, responded_by = $3, reason = $4
      WHERE id = $5
    `, [status, now, respondedBy, reason || null, id]);
        const res = await this.pool.query('SELECT * FROM approvals WHERE id = $1', [id]);
        if (res.rows.length === 0)
            return null;
        const row = res.rows[0];
        return {
            id: row.id,
            taskId: row.task_id,
            stepId: row.step_id,
            workerType: row.worker_type,
            actionName: row.action_name,
            description: row.description,
            parameters: JSON.parse(row.parameters_json),
            riskLevel: row.risk_level,
            status: row.status,
            reason: row.reason || undefined,
            createdAt: row.created_at.toISOString(),
            respondedAt: row.responded_at ? row.responded_at.toISOString() : undefined,
            respondedBy: row.responded_by,
        };
    }
    async listArtifacts(taskId) {
        const res = taskId
            ? await this.pool.query('SELECT * FROM artifacts WHERE task_id = $1 ORDER BY created_at DESC', [taskId])
            : await this.pool.query('SELECT * FROM artifacts ORDER BY created_at DESC LIMIT 100');
        return res.rows.map((r) => ({
            id: r.id,
            taskId: r.task_id,
            stepId: r.step_id || undefined,
            name: r.name,
            type: r.type,
            path: r.path,
            url: r.url,
            size: Number(r.size),
            mimeType: r.mime_type,
            metadata: r.metadata_json ? JSON.parse(r.metadata_json) : undefined,
            createdAt: r.created_at.toISOString(),
        }));
    }
    async createArtifact(art) {
        const id = uuidv4();
        const now = new Date();
        await this.pool.query(`
      INSERT INTO artifacts (
        id, task_id, step_id, name, type, path, url, size, mime_type, metadata_json, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
            id,
            art.taskId,
            art.stepId || null,
            art.name,
            art.type,
            art.path,
            art.url,
            art.size,
            art.mimeType,
            art.metadata ? JSON.stringify(art.metadata) : null,
            now,
        ]);
        return { ...art, id, createdAt: now.toISOString() };
    }
    async getSetting(key, defaultValue) {
        const res = await this.pool.query('SELECT value_json FROM settings WHERE key = $1', [key]);
        if (res.rows.length === 0)
            return defaultValue;
        try {
            return JSON.parse(res.rows[0].value_json);
        }
        catch {
            return defaultValue;
        }
    }
    async setSetting(key, value) {
        const now = new Date();
        await this.pool.query(`
      INSERT INTO settings (key, value_json, updated_at)
      VALUES ($1, $2, $3)
      ON CONFLICT(key) DO UPDATE SET value_json = EXCLUDED.value_json, updated_at = EXCLUDED.updated_at
    `, [key, JSON.stringify(value), now]);
    }
    mapPgTask(row, steps) {
        return {
            id: row.id,
            conversationId: row.conversation_id || undefined,
            title: row.title,
            prompt: row.prompt,
            status: row.status,
            priority: row.priority,
            progressPercent: Number(row.progress_percent),
            currentStepIndex: Number(row.current_step_index),
            retryCount: Number(row.retry_count),
            maxRetries: Number(row.max_retries),
            idempotencyKey: row.idempotency_key || undefined,
            metadata: row.metadata_json ? JSON.parse(row.metadata_json) : undefined,
            resultSummary: row.result_summary || undefined,
            error: row.error || undefined,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
            startedAt: row.started_at ? row.started_at.toISOString() : undefined,
            completedAt: row.completed_at ? row.completed_at.toISOString() : undefined,
            steps,
        };
    }
    mapPgStep(row) {
        return {
            id: row.id,
            taskId: row.task_id,
            stepIndex: Number(row.step_index),
            title: row.title,
            description: row.description || undefined,
            workerType: row.worker_type,
            status: row.status,
            logs: row.logs_json ? JSON.parse(row.logs_json) : [],
            screenshotUrl: row.screenshot_url || undefined,
            terminalOutput: row.terminal_output || undefined,
            inputData: row.input_data_json ? JSON.parse(row.input_data_json) : undefined,
            outputData: row.output_data_json ? JSON.parse(row.output_data_json) : undefined,
            error: row.error || undefined,
            startedAt: row.started_at ? row.started_at.toISOString() : undefined,
            completedAt: row.completed_at ? row.completed_at.toISOString() : undefined,
        };
    }
    mapPgAgent(row) {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            systemPrompt: row.system_prompt,
            avatarKey: row.avatar_key,
            colorHex: row.color_hex,
            capabilities: row.capabilities_json ? JSON.parse(row.capabilities_json) : [],
            memory: row.memory_json ? JSON.parse(row.memory_json) : { userFacts: [], instructions: [], summary: '', lastUpdated: row.updated_at.toISOString() },
            isMainAgent: Boolean(row.is_main),
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
        };
    }
    async listAgents() {
        const res = await this.pool.query('SELECT * FROM agents ORDER BY is_main DESC, created_at ASC');
        if (res.rows.length === 0) {
            const now = new Date().toISOString();
            const defaultAgent = {
                id: 'main-orchestrator',
                name: 'Nexora Brain',
                description: 'Autonomous Task Orchestrator & Multi-Agent Synthesizer. Tell me what you need and I will plan, execute, or build specialized bots for you.',
                systemPrompt: 'You are Nexora Brain, the master autonomous orchestrator and bot architect. You plan, execute, coordinate tasks, and synthesize specialized custom agents for the user.',
                avatarKey: 'orchestrator',
                colorHex: '#3B82F6',
                capabilities: ['ORCHESTRATOR', 'RESEARCH', 'WRITING', 'IMAGE_GEN', 'BROWSER', 'CODE_RUNNER'],
                memory: {
                    userFacts: [
                        'User name: Subhan Zahid',
                        'Platform: Nexora AI Personal Cloud Desktop Agent',
                        'Preferences: Fast execution, persistent background cloud jobs, high retention quality',
                    ],
                    instructions: [
                        'Always prioritize persistent cloud execution',
                        'Create specialized bots when requested by user',
                        'Remember all facts the user teaches you',
                    ],
                    summary: 'Nexora Brain master orchestrator initialized for Subhan Zahid.',
                    lastUpdated: now,
                },
                isMainAgent: true,
                createdAt: now,
                updatedAt: now,
            };
            await this.createAgent(defaultAgent);
            return [defaultAgent];
        }
        return res.rows.map((r) => this.mapPgAgent(r));
    }
    async getAgent(id) {
        const res = await this.pool.query('SELECT * FROM agents WHERE id = $1', [id]);
        if (res.rows.length === 0)
            return null;
        return this.mapPgAgent(res.rows[0]);
    }
    async createAgent(agent) {
        const now = new Date();
        const res = await this.pool.query(`
      INSERT INTO agents (
        id, name, description, system_prompt, avatar_key, color_hex, capabilities_json, memory_json, is_main, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
            agent.id,
            agent.name,
            agent.description,
            agent.systemPrompt,
            agent.avatarKey,
            agent.colorHex,
            JSON.stringify(agent.capabilities || []),
            JSON.stringify(agent.memory),
            Boolean(agent.isMainAgent),
            now,
            now,
        ]);
        return this.mapPgAgent(res.rows[0]);
    }
    async updateAgent(id, updates) {
        const existing = await this.getAgent(id);
        if (!existing)
            return null;
        const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        const res = await this.pool.query(`
      UPDATE agents SET
        name = $1, description = $2, system_prompt = $3, avatar_key = $4, color_hex = $5, capabilities_json = $6, memory_json = $7, updated_at = $8
      WHERE id = $9
      RETURNING *
    `, [
            updated.name,
            updated.description,
            updated.systemPrompt,
            updated.avatarKey,
            updated.colorHex,
            JSON.stringify(updated.capabilities || []),
            JSON.stringify(updated.memory),
            new Date(),
            id,
        ]);
        if (res.rows.length === 0)
            return null;
        return this.mapPgAgent(res.rows[0]);
    }
    async deleteAgent(id) {
        await this.pool.query('DELETE FROM agents WHERE id = $1 AND is_main = FALSE', [id]);
    }
    async updateAgentMemory(id, memoryUpdates) {
        const agent = await this.getAgent(id);
        if (!agent)
            return null;
        const newMemory = {
            userFacts: memoryUpdates.userFacts ?? agent.memory.userFacts ?? [],
            instructions: memoryUpdates.instructions ?? agent.memory.instructions ?? [],
            summary: memoryUpdates.summary ?? agent.memory.summary ?? '',
            lastUpdated: new Date().toISOString(),
        };
        await this.updateAgent(id, { memory: newMemory });
        return newMemory;
    }
}
export const db = config.databaseUrl.startsWith('postgres://') || config.databaseUrl.startsWith('postgresql://')
    ? new PostgresDatabaseService(config.databaseUrl)
    : new SQLiteDatabaseService();
//# sourceMappingURL=index.js.map