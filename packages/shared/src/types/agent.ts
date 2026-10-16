export interface AgentMemory {
  userFacts: string[];
  instructions: string[];
  summary: string;
  lastUpdated: string;
}

export interface CustomAgent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  avatarKey: string;      // 'orchestrator' | 'research' | 'writing' | 'image' | 'video' | 'browser' | 'developer' | 'social' | 'operations' | 'files'
  colorHex: string;       // e.g. '#3B82F6', '#EC4899', etc.
  capabilities: string[]; // e.g. ['BROWSER', 'CODE_RUNNER', 'RESEARCH', 'WRITING', 'IMAGE_GEN']
  memory: AgentMemory;
  createdAt: string;
  updatedAt: string;
  isMainAgent?: boolean;
}

export interface CreateAgentDto {
  name: string;
  description?: string;
  systemPrompt?: string;
  avatarKey?: string;
  colorHex?: string;
  capabilities?: string[];
  initialFacts?: string[];
}

export interface GenerateAgentDto {
  userRequirement: string;
}
