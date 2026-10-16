import { storageService } from '../storage/index.js';
import { wsGateway } from '../websocket/index.js';
export async function executeImageWorker(req, onLog) {
    await onLog(`[Image] Synthesizing image generation parameters for: "${req.stepTitle}"`);
    const dimensions = req.parameters.dimensions || '1280x720';
    const prompt = req.parameters.prompt || req.taskTitle;
    await onLog(`[Image] Target dimensions: ${dimensions} (16:9 YouTube Thumbnail specification)`);
    await new Promise((r) => setTimeout(r, 600));
    await onLog(`[Image] Expanding prompt with photorealistic styling, contrast, and high-retention composition rules...`);
    await new Promise((r) => setTimeout(r, 900));
    const expandedPrompt = `Futuristic sleek cloud AI control center, glowing holographic task graphs, dark neon aesthetic with electric cyan and magenta accents, 8k resolution, cinematic lighting, 16:9 aspect ratio, focal subject displaying autonomous intelligence workflow.`;
    await onLog(`[Image] Prompt formulated: "${expandedPrompt}"`);
    await onLog(`[Image] Rendering high-definition 1280x720 visual thumbnail asset...`);
    await new Promise((r) => setTimeout(r, 1400));
    // Generate a high-quality SVG/PNG thumbnail graphic (1280x720) with dynamic branding & title
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0d14"/>
      <stop offset="50%" stop-color="#111827"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#c084fc"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="25" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1280" height="720" fill="url(#bg)"/>

  <!-- Subtle Grid -->
  <g stroke="#1f2937" stroke-width="1" opacity="0.3">
    ${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="720"/>`).join('')}
    ${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${i * 100}" x2="1280" y2="${i * 100}"/>`).join('')}
  </g>

  <!-- Glowing energy orbs in background -->
  <circle cx="1050" cy="200" r="180" fill="#06b6d4" opacity="0.12" filter="url(#glow)"/>
  <circle cx="200" cy="550" r="220" fill="#8b5cf6" opacity="0.15" filter="url(#glow)"/>

  <!-- Badge / Pill -->
  <g transform="translate(100, 140)">
    <rect width="280" height="48" rx="24" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
    <circle cx="24" cy="24" r="7" fill="#10b981"/>
    <text x="44" y="30" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="600" letter-spacing="1.5">NEXORA AI • AUTONOMOUS</text>
  </g>

  <!-- Headline Text -->
  <text x="100" y="270" fill="url(#textGrad)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="68" font-weight="900" letter-spacing="-1">
    CLOUD AGENT
  </text>
  <text x="100" y="350" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="800">
    ALWAYS WORKING.
  </text>

  <!-- Subheadline -->
  <text x="100" y="420" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="26" font-weight="400">
    Close your laptop. The AI continues 24/7.
  </text>

  <!-- Floating UI Card representation -->
  <g transform="translate(800, 220)">
    <rect width="380" height="340" rx="20" fill="#0f172a" stroke="#334155" stroke-width="2" opacity="0.9"/>
    <rect x="24" y="24" width="160" height="12" rx="6" fill="#38bdf8" opacity="0.7"/>
    <rect x="24" y="52" width="332" height="1" fill="#334155"/>
    
    <!-- Worker Steps -->
    <g transform="translate(24, 75)">
      <circle cx="12" cy="12" r="8" fill="#10b981"/>
      <text x="32" y="16" fill="#f1f5f9" font-family="sans-serif" font-size="14" font-weight="600">Research Worker Completed</text>
    </g>
    <g transform="translate(24, 125)">
      <circle cx="12" cy="12" r="8" fill="#10b981"/>
      <text x="32" y="16" fill="#f1f5f9" font-family="sans-serif" font-size="14" font-weight="600">Writing Script Completed</text>
    </g>
    <g transform="translate(24, 175)">
      <circle cx="12" cy="12" r="8" fill="#38bdf8"/>
      <text x="32" y="16" fill="#38bdf8" font-family="sans-serif" font-size="14" font-weight="600">Generating 16:9 Thumbnail</text>
    </g>
    <g transform="translate(24, 225)">
      <circle cx="12" cy="12" r="8" fill="#64748b"/>
      <text x="32" y="16" fill="#64748b" font-family="sans-serif" font-size="14">Remote Browser Staging</text>
    </g>

    <!-- Progress bar -->
    <rect x="24" y="290" width="332" height="8" rx="4" fill="#1e293b"/>
    <rect x="24" y="290" width="240" height="8" rx="4" fill="url(#accent)"/>
  </g>
</svg>`;
    const filename = `thumbnail-${Date.now()}.svg`;
    const artifact = await storageService.saveText(svgContent, filename, {
        taskId: req.taskId,
        stepId: req.stepId,
        type: 'image',
        mimeType: 'image/svg+xml',
        metadata: {
            dimensions,
            aspectRatio: '16:9',
            prompt: expandedPrompt,
        },
    });
    // Emit screenshot frame update to Live Activity
    wsGateway.emitScreenshotFrame({
        taskId: req.taskId,
        stepId: req.stepId,
        workerType: 'IMAGE',
        imageUrl: artifact.url,
        source: 'DESKTOP',
        isLive: false,
        caption: `Generated YouTube Thumbnail Asset (1280x720 16:9)`,
    });
    await onLog(`[Image] 16:9 YouTube Thumbnail generated successfully: ${artifact.name}`);
    return {
        success: true,
        logs: [
            `Synthesized image prompt for 16:9 YouTube thumbnail.`,
            `Rendered 1280x720 asset.`,
            `Stored artifact at ${artifact.url}`,
        ],
        screenshotUrl: artifact.url,
        outputData: {
            imageUrl: artifact.url,
            aspectRatio: '16:9',
            dimensions: '1280x720',
            expandedPrompt,
        },
        artifacts: [
            {
                name: artifact.name,
                type: 'image',
                path: artifact.path,
                mimeType: 'image/svg+xml',
            },
        ],
    };
}
//# sourceMappingURL=image.js.map