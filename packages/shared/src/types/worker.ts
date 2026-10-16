export type WorkerType =
  | 'RESEARCH'
  | 'WRITING'
  | 'IMAGE'
  | 'VIDEO'
  | 'BROWSER'
  | 'DEVELOPER'
  | 'SOCIAL'
  | 'OPERATIONS';

export interface WorkerInfo {
  type: WorkerType;
  name: string;
  description: string;
  status: 'IDLE' | 'BUSY' | 'OFFLINE' | 'ERROR';
  currentTaskId?: string;
  supportedTools: string[];
}

export interface WorkerExecutionRequest {
  taskId: string;
  stepId: string;
  workerType: WorkerType;
  taskTitle: string;
  stepTitle: string;
  prompt: string;
  parameters: Record<string, any>;
  previousStepOutputs?: Record<string, any>[];
}

export interface WorkerExecutionResult {
  success: boolean;
  outputData: Record<string, any>;
  logs: string[];
  terminalOutput?: string;
  screenshotUrl?: string;
  error?: string;
  artifacts?: {
    name: string;
    type: 'image' | 'video' | 'document' | 'code' | 'screenshot' | 'log';
    path: string;
    mimeType?: string;
  }[];
}
