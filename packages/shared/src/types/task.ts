export type TaskStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'RUNNING'
  | 'WAITING_FOR_APPROVAL'
  | 'RETRYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type TaskPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface TaskStep {
  id: string;
  taskId: string;
  stepIndex: number;
  title: string;
  description?: string;
  workerType: string;
  status: TaskStatus;
  logs: string[];
  screenshotUrl?: string;
  terminalOutput?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
}

export interface Task {
  id: string;
  conversationId?: string;
  title: string;
  prompt: string;
  status: TaskStatus;
  priority: TaskPriority;
  steps: TaskStep[];
  currentStepIndex: number;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  resultSummary?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}
