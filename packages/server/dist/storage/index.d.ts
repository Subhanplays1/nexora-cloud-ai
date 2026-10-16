import { Artifact, ArtifactType } from '@nexora/shared';
export declare class StorageService {
    private baseDir;
    constructor();
    getFilePath(filename: string): string;
    getUrl(filename: string): string;
    saveBuffer(buffer: Buffer, filename: string, options: {
        taskId: string;
        stepId?: string;
        type: ArtifactType;
        mimeType: string;
        metadata?: Record<string, any>;
    }): Promise<Artifact>;
    saveText(text: string, filename: string, options: {
        taskId: string;
        stepId?: string;
        type: ArtifactType;
        mimeType?: string;
        metadata?: Record<string, any>;
    }): Promise<Artifact>;
    saveBase64Image(base64Data: string, filename: string, options: {
        taskId: string;
        stepId?: string;
        mimeType?: string;
        metadata?: Record<string, any>;
    }): Promise<Artifact>;
    saveScreenshot(buffer: Buffer, taskId: string, stepId: string, metadata?: Record<string, any>): Promise<Artifact>;
}
export declare const storageService: StorageService;
//# sourceMappingURL=index.d.ts.map