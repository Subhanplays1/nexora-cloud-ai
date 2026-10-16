import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

// Look for .env in current folder, packages/server, or root
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve('D:/nexora-ai/.env'),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    break;
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  databaseUrl: process.env.DATABASE_URL || '',
  redisUrl: process.env.REDIS_URL || '',
  storageDir: process.env.STORAGE_DIR || (process.platform === 'win32' ? 'D:/nexora-ai/storage' : path.resolve(process.cwd(), 'storage')),
  dataDir: process.env.DATA_DIR || (process.platform === 'win32' ? 'D:/nexora-ai/data' : path.resolve(process.cwd(), 'data')),
  workspaceDir: process.env.WORKSPACE_DIR || (process.platform === 'win32' ? 'D:/nexora-ai/workspaces' : path.resolve(process.cwd(), 'workspaces')),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'nexora-ai-secret-key-change-in-production',
  screenshotIntervalMs: parseInt(process.env.SCREENSHOT_INTERVAL_MS || '1500', 10),
};

// Ensure critical directories exist
for (const dir of [config.storageDir, config.dataDir, config.workspaceDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
