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
    avatarKey: string;
    colorHex: string;
    capabilities: string[];
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
//# sourceMappingURL=agent.d.ts.map