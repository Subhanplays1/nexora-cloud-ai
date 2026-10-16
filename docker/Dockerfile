FROM node:22-bookworm-slim

# Install system dependencies: FFmpeg, Chromium dependencies, and process managers
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    ca-certificates \
    curl \
    git \
    procps \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy root configurations and package definitions
COPY package.json tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/server/package.json ./packages/server/

# Install dependencies
RUN npm install -w @nexora/shared -w @nexora/server

# Install Playwright Chromium browser
RUN npx playwright install chromium

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server

# Build TypeScript packages
RUN npm run build:shared
RUN npm run build:server

# Create storage, workspace, and data directories
RUN mkdir -p /app/storage /app/workspaces /app/data

EXPOSE 3001

CMD ["node", "packages/server/dist/index.js"]
