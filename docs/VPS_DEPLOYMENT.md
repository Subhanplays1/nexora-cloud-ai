# NEXORA AI — Production VPS Deployment Guide

This guide covers deploying the **Nexora AI** cloud backend, orchestrator, and worker pool to a persistent Linux Virtual Private Server (VPS) on providers such as Hetzner, DigitalOcean, Linode, AWS EC2, or Render.

---

## 1. System Requirements

- **Operating System:** Ubuntu 22.04 LTS or Debian 12
- **Hardware:**
  - Minimum: 2 vCPU, 4 GB RAM, 40 GB NVMe SSD
  - Recommended: 4 vCPU, 8 GB RAM (for concurrent Playwright sessions and FFmpeg encoding)
- **Software:** Docker, Docker Compose, Git

---

## 2. Docker Deployment (Recommended)

### Step 1: Install Docker & Git on VPS
```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y curl git ufw ca-certificates gnupg

# Install Docker engine
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt-get install -y docker-compose-plugin
```

### Step 2: Clone and Configure Environment
```bash
git clone <your-private-repo-url> /opt/nexora-ai
cd /opt/nexora-ai

# Create production environment file
cp .env.example .env
nano .env
```

Ensure the following variables are set in `.env`:
```env
PORT=3001
HOST=0.0.0.0
NODE_ENV=production

# Server-side Gemini API credentials
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-3.8-flash

# Database & Queue (provided automatically by docker-compose)
DATABASE_URL=postgresql://nexora:nexora_secure_password@postgres:5432/nexora
REDIS_URL=redis://redis:6379

STORAGE_DIR=/app/storage
WORKSPACE_DIR=/app/workspaces
DATA_DIR=/app/data
JWT_SECRET=generate-a-random-64-character-secret
```

### Step 3: Launch Containers
```bash
docker compose up -d --build
```

Verify services are healthy:
```bash
docker compose ps
docker compose logs -f nexora-server
```

---

## 3. Nginx Reverse Proxy with SSL (Let's Encrypt)

Install Nginx and Certbot:
```bash
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

Configure `/etc/nginx/sites-available/nexora.conf`:
```nginx
server {
    server_name nexora.yourdomain.com;

    # REST API & Artifacts
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 100M;
    }

    # WebSocket Real-Time Gateway
    location /ws {
        proxy_pass http://127.0.0.1:3001/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable site and acquire SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/nexora.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d nexora.yourdomain.com
```

---

## 4. Connecting Your Desktop Application

1. Open the **Nexora AI** desktop application on your Windows computer.
2. Navigate to **Settings** in the left sidebar.
3. In **Cloud Backend API URL**, enter:
   `https://nexora.yourdomain.com` (or `http://<your-vps-ip>:3001` if direct).
4. Click **Connect**. The status indicator in the top right and sidebar will turn green (**Backend Online**).

Tasks delegated from your laptop will now execute persistently on the remote VPS cloud workers, surviving laptop closures, reboots, and network disconnects.

---

## 5. Backup & Recovery

- **PostgreSQL Database Backup:**
  ```bash
  docker exec -t nexora-postgres pg_dump -U nexora nexora > /backup/nexora-$(date +%F).sql
  ```
- **Storage Volume Backup:**
  ```bash
  tar -czvf /backup/storage-$(date +%F).tar.gz /var/lib/docker/volumes/nexora-ai_storage_data/_data
  ```
