import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../db/index.js';
import { orchestrator } from '../orchestrator/gemini.js';
import { workerPool } from '../workers/index.js';
import { taskQueue } from '../queue/index.js';

test('Database Service: creates conversations and tasks with steps', async () => {
  await db.init();

  // Test conversation creation
  const conv = await db.createConversation('Test Autonomous Chat');
  assert.ok(conv.id, 'Conversation should have an ID');
  assert.equal(conv.title, 'Test Autonomous Chat');

  // Test message creation
  const msg = await db.createMessage({
    conversationId: conv.id,
    role: 'user',
    content: 'Research quantum computing and write a YouTube script',
    status: 'SENT',
  });
  assert.ok(msg.id, 'Message should have an ID');

  const messages = await db.listMessages(conv.id);
  assert.equal(messages.length, 1);
  assert.equal(messages[0].content, 'Research quantum computing and write a YouTube script');

  // Test task creation
  const task = await db.createTask({
    conversationId: conv.id,
    title: 'Research and Script Production',
    prompt: 'Research quantum computing and write a YouTube script',
    status: 'PENDING',
    priority: 'HIGH',
    maxRetries: 3,
    steps: [
      {
        stepIndex: 0,
        title: 'Conduct In-Depth Research',
        workerType: 'RESEARCH',
        description: 'Gather verified quantum computing sources',
      },
      {
        stepIndex: 1,
        title: 'Draft Script and Outline',
        workerType: 'WRITING',
        description: 'Draft 5-minute video script',
      },
    ],
  });

  assert.ok(task.id, 'Task should have an ID');
  assert.equal(task.steps.length, 2);
  assert.equal(task.steps[0].workerType, 'RESEARCH');
  assert.equal(task.steps[1].workerType, 'WRITING');

  // Test task update
  const updated = await db.updateTask(task.id, {
    status: 'RUNNING',
    progressPercent: 50,
  });
  assert.equal(updated?.status, 'RUNNING');
  assert.equal(updated?.progressPercent, 50);
});

test('Orchestrator: plans execution into multi-worker steps', async () => {
  const plan = await orchestrator.planExecution(
    'Research quantum computing breakthroughs in 2026 and write a 3-minute YouTube script with thumbnail ideas'
  );

  assert.ok(plan.taskTitle, 'Plan must have a title');
  assert.ok(plan.steps.length >= 2, 'Should decompose into at least 2 steps');
  assert.equal(plan.steps[0].workerType, 'RESEARCH');
  assert.equal(plan.steps[1].workerType, 'WRITING');
});

test('Worker Pool: provides metadata for 8 specialized workers', async () => {
  const workers = workerPool.getWorkerInfos();
  assert.equal(workers.length, 8);
  const types = workers.map((w) => w.type);
  assert.ok(types.includes('RESEARCH'));
  assert.ok(types.includes('WRITING'));
  assert.ok(types.includes('IMAGE'));
  assert.ok(types.includes('VIDEO'));
  assert.ok(types.includes('BROWSER'));
  assert.ok(types.includes('DEVELOPER'));
  assert.ok(types.includes('SOCIAL'));
  assert.ok(types.includes('OPERATIONS'));
});

test('Queue Engine: executes task steps and updates progress', async () => {
  taskQueue.setStepExecutor(async (taskId, stepId, workerType) => {
    return {
      success: true,
      outputData: { executedWorker: workerType, timestamp: new Date().toISOString() },
    };
  });

  const task = await db.createTask({
    title: 'Test Queue Execution',
    prompt: 'Execute rapid queue verification',
    status: 'PENDING',
    priority: 'NORMAL',
    maxRetries: 2,
    steps: [
      {
        stepIndex: 0,
        title: 'Step 1: Rapid Probe',
        workerType: 'OPERATIONS',
        description: 'Verify queue dispatch',
      },
    ],
  });

  // Enqueue and run
  await taskQueue.init();
  await taskQueue.start();
  await taskQueue.enqueueTask(task.id);

  // Allow queue loop to process
  let completed = false;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 200));
    const current = await db.getTask(task.id);
    if (current?.status === 'COMPLETED') {
      completed = true;
      break;
    }
  }

  assert.ok(completed, 'Task should have transitioned to COMPLETED status');
  await taskQueue.stop();
});
