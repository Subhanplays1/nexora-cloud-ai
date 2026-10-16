import { db } from '../db/index.js';
import { workerPool } from '../workers/index.js';
import { orchestrator } from '../orchestrator/gemini.js';
import { config } from '../config/env.js';
export async function settingsRoutes(fastify) {
    // Workers listing
    fastify.get('/api/workers', async () => {
        return workerPool.getWorkerInfos();
    });
    // Settings get
    fastify.get('/api/settings', async () => {
        const saved = (await db.getSetting('app_settings', {})) || {};
        return {
            geminiApiKeyConfigured: Boolean(config.geminiApiKey),
            geminiModel: config.geminiModel,
            databaseUrlConfigured: Boolean(config.databaseUrl),
            redisUrlConfigured: Boolean(config.redisUrl),
            screenshotIntervalMs: config.screenshotIntervalMs,
            integrations: {
                youtube: saved.youtube || { connected: false, channelName: '', status: 'READY_TO_CONNECT' },
                googleDrive: saved.googleDrive || { connected: false, email: '', status: 'READY_TO_CONNECT' },
                imageProvider: saved.imageProvider || { provider: 'Gemini / Vector Engine', status: 'ACTIVE' },
            },
            userPreferences: saved.userPreferences || {
                darkTheme: true,
                autoApproveLowRisk: false,
                soundNotifications: true,
            },
        };
    });
    // Settings update
    fastify.post('/api/settings', async (req) => {
        const { geminiApiKey, geminiModel, integrations, userPreferences } = req.body;
        if (geminiApiKey) {
            orchestrator.updateApiKey(geminiApiKey);
        }
        if (geminiModel) {
            config.geminiModel = geminiModel;
        }
        const current = (await db.getSetting('app_settings', {})) || {};
        const updated = {
            ...current,
            ...(integrations ? { integrations: { ...current.integrations, ...integrations } } : {}),
            ...(userPreferences ? { userPreferences: { ...current.userPreferences, ...userPreferences } } : {}),
        };
        await db.setSetting('app_settings', updated);
        return {
            success: true,
            geminiApiKeyConfigured: Boolean(config.geminiApiKey),
            geminiModel: config.geminiModel,
            updated,
        };
    });
}
//# sourceMappingURL=settings.js.map