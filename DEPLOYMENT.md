# ALPHA CLASSROOM — Production Deployment Guide

This guide details the complete, step-by-step procedure for deploying **ALPHA CLASSROOM** to a production Linux Virtual Private Server (VPS) running Ubuntu 22.04 or 24.04 LTS with Docker, Docker Compose, Nginx, and Let's Encrypt SSL.

---

## 1. Architecture Overview

```
                          Internet (Clients / Browsers)
                                       │
                              HTTPS:443 / WSS:443
                                       ▼
                       ┌──────────────────────────────┐
                       │   Nginx (Reverse Proxy +     │
                       │    Let's Encrypt SSL)        │
                       └──────────────┬───────────────┘
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            │                         │                         │
            ▼ (Proxy :3000)           ▼ (Proxy :4000)           ▼ (Proxy :7880)
   ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
   │ Next.js Frontend │      │ NestJS API Core  │      │  LiveKit Server  │
   │  (Standalone)    │      │ (Helmet, Limit)  │      │  (WebRTC Audio/  │
   └──────────────────┘      └────────┬─────────┘      │   Video/Screen)  │
                                      │                └────────┬─────────┘
                                      ▼                         │
                             ┌──────────────────┐               │
                             │  PostgreSQL 18   │               │
                             │ (Volume: pgdata) │◄──────────────┘
                             └──────────────────┘
```

---

## 2. Server Sizing & Prerequisites

### Minimum Hardware Recommendations
| Component | Minimum | Recommended (100+ Live Users) |
| :--- | :--- | :--- |
| **CPU** | 2 vCPUs | 4 - 8 vCPUs |
| **RAM** | 4 GB | 8 - 16 GB |
| **Disk** | 40 GB NVMe SSD | 100+ GB NVMe (for recordings) |
| **Bandwidth** | 1 Gbps port | 1 Gbps unmetered |
| **OS** | Ubuntu 22.04 / 24.04 LTS | Ubuntu 24.04 LTS |

### Domain Names & DNS Setup
Point an **A Record** from your domain registrar to your server's Public IPv4:
- `classroom.yourdomain.com` ➔ `YOUR_SERVER_IP`

---

## 3. Server Initialization & Firewall Configuration

### 3.1 Update Base Packages
Connect via SSH to your VPS and update package indexes:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw software-properties-common ca-certificates gnupg
```

### 3.2 Configure UFW Firewall
Allow SSH, Web traffic, and LiveKit WebRTC media ports:
```bash
# Core web & administration
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# LiveKit WebRTC signaling and media ports
sudo ufw allow 7880/tcp             # LiveKit HTTP/WebSocket signaling
sudo ufw allow 7881/tcp             # WebRTC TCP fallback
sudo ufw allow 7882/udp             # WebRTC UDP signaling
sudo ufw allow 50000:50050/udp      # WebRTC media ICE/UDP ports

# Enable firewall
sudo ufw --force enable
sudo ufw status verbose
```

---

## 4. Install Docker & Docker Compose Plugin

```bash
# Add Docker official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

---

## 5. Clone Project & Configure Environment

```bash
# Clone the repository
cd /opt
sudo git clone https://github.com/your-org/alpha-classroom.git
cd alpha-classroom
sudo chown -R $USER:$USER /opt/alpha-classroom

# Create production environment file from template
cp .env.production.example .env.production
chmod 600 .env.production
```

### Edit Production Variables
Open `.env.production` using `nano`:
```bash
nano .env.production
```

Configure your secure credentials:
```ini
# PostgreSQL 18
POSTGRES_USER=alpha_admin
POSTGRES_PASSWORD=YourExtremelySecureDbPass2026!
POSTGRES_DB=alpha_classroom_db

# LiveKit Server Keys (Keep devkey/secret or generate custom 32-character strings)
LIVEKIT_API_KEY=alpha_livekit_prod_key
LIVEKIT_API_SECRET=alpha_livekit_prod_secret_32_chars
LIVEKIT_INTERNAL_URL=http://livekit:7880

# NestJS Backend API
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://alpha_admin:YourExtremelySecureDbPass2026!@postgres:5432/alpha_classroom_db?schema=public
JWT_SECRET=run_openssl_rand_base64_32_to_generate_this
JWT_EXPIRATION=7d
FRONTEND_URL=https://classroom.yourdomain.com

# Next.js 16 Frontend
NEXT_PUBLIC_API_URL=https://classroom.yourdomain.com/api/v1
NEXT_PUBLIC_LIVEKIT_URL=wss://classroom.yourdomain.com/livekit
```

> [!TIP]
> Generate secure secrets easily using:
> `openssl rand -base64 32`

---

## 6. Launch Containers with Docker Compose

Build images and launch all 4 services in detached mode:
```bash
docker compose --env-file .env.production up -d --build
```

### Verify Container Status
```bash
docker compose ps
```
All four services (`alpha-postgres`, `alpha-livekit`, `alpha-backend`, `alpha-frontend`) should show state `Up` (and `healthy` for postgres).

### Seed the Initial Admin Account
Once the backend container is healthy and migrations have applied automatically:
```bash
docker compose exec backend npx tsx prisma/seed.ts
```
This initializes the standard Super Admin account:
- **Email:** `admin@alphacoding.com`
- **Password:** `Alpha@2026!`

---

## 7. Install Nginx and Configure Reverse Proxy

Install Nginx:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Create Nginx Virtual Host Configuration
Create `/etc/nginx/sites-available/alpha-classroom`:
```bash
sudo nano /etc/nginx/sites-available/alpha-classroom
```

Paste the following production configuration:
```nginx
# Map for WebSocket upgrades
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 80;
    listen [::]:80;
    server_name classroom.yourdomain.com;

    # Client body limit for video lecture uploads
    client_max_body_size 1024M;

    # 1. Frontend Web Application (Next.js 16 Standalone)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 2. Backend REST API Core
    location /api/v1/ {
        proxy_pass http://127.0.0.1:4000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 3. Static Media & Recording Streaming (Supports HTTP 206 Partial Content Range)
    location /uploads/ {
        proxy_pass http://127.0.0.1:4000/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Range $http_range;
        proxy_set_header If-Range $http_if_range;
        proxy_cache_bypass $http_range;
        proxy_no_cache $http_range;
    }

    # 4. LiveKit Real-Time WebRTC Signaling (WebSocket)
    location /livekit/ {
        proxy_pass http://127.0.0.1:7880/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

Enable site and test Nginx syntax:
```bash
sudo ln -sf /etc/nginx/sites-available/alpha-classroom /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 8. Obtain SSL Certificate with Certbot

Acquire a free, automated Let's Encrypt certificate:
```bash
sudo certbot --nginx -d classroom.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com --redirect
```

Certbot automatically configures HTTPS port 443, sets up TLS ciphers, and registers an automatic cron job for 90-day certificate renewals.

Verify certificate renewal:
```bash
sudo certbot renew --dry-run
```

---

## 9. Verification & Health Monitoring

### 9.1 Verify Backend Health
Query the public health endpoint:
```bash
curl -s https://classroom.yourdomain.com/api/v1/health | jq .
```
Expected response:
```json
{
  "status": "ok",
  "service": "ALPHA CLASSROOM Backend API",
  "version": "1.0.0",
  "timestamp": "2026-11-05T12:00:00.000Z",
  "uptime": 120,
  "database": {
    "status": "up",
    "connected": true,
    "provider": "postgresql"
  }
}
```

### 9.2 Rate Limiting Verification
Run a rapid request loop to verify `@nestjs/throttler`:
```bash
for i in {1..15}; do curl -s -o /dev/null -w "%{http_code}\n" -X POST https://classroom.yourdomain.com/api/v1/auth/login; done
```
You will observe HTTP `429 Too Many Requests` after the 10th request within the 1-minute window on `/api/v1/auth/login`.

---

## 10. Automated Backups & Maintenance

### 10.1 Daily PostgreSQL Database Backup Script
Create `/usr/local/bin/backup-alpha-db.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/alpha-classroom"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "$BACKUP_DIR"

docker compose -f /opt/alpha-classroom/docker-compose.yml exec -T postgres \
  pg_dump -U alpha_admin alpha_classroom_db | gzip > "$BACKUP_DIR/alpha_db_$TIMESTAMP.sql.gz"

# Retain backups for 14 days
find "$BACKUP_DIR" -type f -mtime +14 -name "*.sql.gz" -delete
```

Make executable and add to crontab:
```bash
sudo chmod +x /usr/local/bin/backup-alpha-db.sh
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/backup-alpha-db.sh") | crontab -
```

### 10.2 Zero-Downtime Rolling Updates
To deploy an updated version from Git:
```bash
cd /opt/alpha-classroom
git pull origin master
docker compose --env-file .env.production build
docker compose --env-file .env.production up -d --no-deps backend frontend
```
Prisma migrations run automatically on backend container startup via `prisma migrate deploy`.
