import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import { db } from '../db/index.js';
import { Artifact, ArtifactType } from '@nexora/shared';

export class StorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = config.storageDir;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  getFilePath(filename: string): string {
    return path.join(this.baseDir, filename);
  }

  getUrl(filename: string): string {
    return `/artifacts/${filename}`;
  }

  async saveBuffer(
    buffer: Buffer,
    filename: string,
    options: {
      taskId: string;
      stepId?: string;
      type: ArtifactType;
      mimeType: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Artifact> {
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

  async saveText(
    text: string,
    filename: string,
    options: {
      taskId: string;
      stepId?: string;
      type: ArtifactType;
      mimeType?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Artifact> {
    const buffer = Buffer.from(text, 'utf-8');
    return this.saveBuffer(buffer, filename, {
      ...options,
      mimeType: options.mimeType || 'text/plain',
    });
  }

  async saveBase64Image(
    base64Data: string,
    filename: string,
    options: {
      taskId: string;
      stepId?: string;
      mimeType?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Artifact> {
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

  async saveScreenshot(
    buffer: Buffer,
    taskId: string,
    stepId: string,
    metadata?: Record<string, any>
  ): Promise<Artifact> {
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
