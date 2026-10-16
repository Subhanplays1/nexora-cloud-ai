export type ArtifactType =
  | 'image'
  | 'video'
  | 'document'
  | 'code'
  | 'screenshot'
  | 'log'
  | 'data';

export interface Artifact {
  id: string;
  taskId: string;
  stepId?: string;
  name: string;
  type: ArtifactType;
  path: string;
  url: string;
  size: number;
  mimeType: string;
  metadata?: Record<string, any>;
  createdAt: string;
}
