import { WorkerType } from './worker.js';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface ApprovalRequest {
  id: string;
  taskId: string;
  stepId: string;
  workerType: WorkerType;
  actionName: string;
  description: string;
  parameters: Record<string, any>;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  createdAt: string;
  respondedAt?: string;
  respondedBy?: string;
  reason?: string;
}
