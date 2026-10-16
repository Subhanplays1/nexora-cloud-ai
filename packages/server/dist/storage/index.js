import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { db } from '../db/index.js';
export class StorageService {
    baseDir;
    constructor() {
        this.baseDir = config.storageDir;
        if (!fs.existsSync(this.baseDir)) {
            fs.mkdirSync(this.baseDir, { recursive: true });
        }
    }
    getFilePath(filename) {
        return path.join(this.baseDir, filename);
    }
    getUrl(filename) {
        return `/artifacts/${filename}`;
    }
    async saveBuffer(buffer, filename, options) {
        const ext = path.extname(filename);
        const uniqueName = `${Date.now()}-${uuidv4().slice(0, 8)}${ext ? ext : ''}-${path.basename(filename)}`;
        const fullPath = path.join(this.baseDir, uniqueName);
        await fs.promises.writeFile(fullPath, buffer);
        const size = buffer.length;
        return db.createArtifact({
            taskId: options.taskId,
            stepId: options.stepId,
            name: filename,
            type: options.type,
            path: fullPath,
            url: this.getUrl(uniqueName),
            size,
            mimeType: options.mimeType,
            metadata: options.metadata,
        });
    }
    async saveText(text, filename, options) {
        const buffer = Buffer.from(text, 'utf-8');
        return this.saveBuffer(buffer, filename, {
            ...options,
            mimeType: options.mimeType || 'text/plain',
        });
    }
    async saveBase64Image(base64Data, filename, options) {
        const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(cleanBase64, 'base64');
        return this.saveBuffer(buffer, filename, {
            taskId: options.taskId,
            stepId: options.stepId,
            type: 'image',
            mimeType: options.mimeType || 'image/png',
            metadata: options.metadata,
        });
    }
    async saveScreenshot(buffer, taskId, stepId, metadata) {
        const filename = `screenshot-${Date.now()}.png`;
        return this.saveBuffer(buffer, filename, {
            taskId,
            stepId,
            type: 'screenshot',
            mimeType: 'image/png',
            metadata,
        });
    }
}
export const storageService = new StorageService();
//# sourceMappingURL=index.js.map