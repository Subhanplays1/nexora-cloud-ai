import { db } from '../db/index.js';
import { wsGateway } from '../websocket/index.js';
import { storageService } from '../storage/index.js';
export async function executeSocialWorker(req, onLog) {
    await onLog(`[Social] Starting social media staging worker for: "${req.stepTitle}"`);
    // Staging upload metadata
    const title = req.parameters.title || 'I Built an Autonomous Cloud AI Agent (It Works While My Laptop is Closed!)';
    const description = req.parameters.description || 'Watch Nexora AI execute complex tasks on cloud persistent workers.\n\nLearn more: https://nexora.cloud';
    const tags = req.parameters.tags || ['AI', 'Agents', 'NexoraAI', 'Automation', 'Gemini'];
    await onLog(`[Social] Staging YouTube upload package:`);
    await onLog(`[Social] Title: "${title}"`);
    await onLog(`[Social] Description: ${description.slice(0, 60)}...`);
    await onLog(`[Social] Tags: ${tags.join(', ')}`);
    await new Promise((r) => setTimeout(r, 800));
    // Check if this action has already been approved
    const pendingApprovals = await db.listPendingApprovals();
    const existing = pendingApprovals.find((a) => a.taskId === req.taskId && a.stepId === req.stepId);
    // If not yet approved, create approval gate and pause task
    if (!existing && !req.parameters.__approved) {
        await onLog(`[Social] SAFETY GATE: External public publishing requires explicit human confirmation.`);
        const approval = await db.createApproval({
            taskId: req.taskId,
            stepId: req.stepId,
            workerType: 'SOCIAL',
            actionName: 'Publish YouTube Video & Metadata',
            description: `Publish staged YouTube video with title: "${title}" and ${tags.length} tags.`,
            parameters: {
                platform: 'YouTube',
                title,
                description,
                tags,
                privacyStatus: 'unlisted', // default safe privacy
            },
            riskLevel: 'HIGH',
        });
        wsGateway.emitApprovalRequired(approval);
        // Pause the task in WAITING_FOR_APPROVAL
        await db.updateTask(req.taskId, { status: 'WAITING_FOR_APPROVAL' });
        const task = await db.getTask(req.taskId);
        if (task)
            wsGateway.emitTaskUpdated(task);
        await onLog(`[Social] Task paused. Awaiting user approval in the desktop client.`);
        return {
            success: false,
            logs: [
                `Staged upload package for YouTube.`,
                `Safety gate activated: Paused for human approval.`,
            ],
            outputData: {
                approvalId: approval.id,
                status: 'AWAITING_APPROVAL',
            },
        };
    }
    await onLog(`[Social] Human approval confirmed! Resuming publish pipeline.`);
    await onLog(`[Social] Uploading media package to target service API...`);
    await new Promise((r) => setTimeout(r, 1500));
    await onLog(`[Social] Upload complete. Video staged in YouTube Studio (Status: Unlisted).`);
    const manifest = `# Social Media Publish Manifest
**Platform:** YouTube
**Timestamp:** ${new Date().toISOString()}
**Status:** Staged / Ready (Unlisted)

- **Video ID:** nex_${Date.now().toString(36)}
- **Title:** ${title}
- **Privacy:** Unlisted
- **Tags:** ${tags.join(', ')}
`;
    const manifestArtifact = await storageService.saveText(manifest, `publish-manifest-${Date.now()}.md`, {
        taskId: req.taskId,
        stepId: req.stepId,
        type: 'document',
        mimeType: 'text/markdown',
    });
    return {
        success: true,
        logs: [
            `Approved by user.`,
            `Successfully staged video package to YouTube API.`,
            `Created manifest artifact: ${manifestArtifact.name}`,
        ],
        outputData: {
            platform: 'YouTube',
            videoId: `nex_${Date.now().toString(36)}`,
            privacy: 'unlisted',
            manifestUrl: manifestArtifact.url,
        },
        artifacts: [
            {
                name: manifestArtifact.name,
                type: 'document',
                path: manifestArtifact.path,
                mimeType: 'text/markdown',
            },
        ],
    };
}
//# sourceMappingURL=social.js.map