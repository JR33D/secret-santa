# Docker Deployment Guide

Comprehensive guide for deploying Secret Santa using Docker in production environments.

## Table of Contents

- [Overview](#overview)
- [Docker Images](#docker-images)
- [Deployment Methods](#deployment-methods)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [Backup and Restore](#backup-and-restore)
- [Monitoring](#monitoring)
- [Scaling and Performance](#scaling-and-performance)

---

## Overview

The Secret Santa application is distributed as multi-architecture Docker images supporting:

- `linux/amd64` (Intel/AMD 64-bit)
- `linux/arm64` (ARM 64-bit, including Raspberry Pi 4, Apple Silicon)

### Why Docker?

- **Consistency**: Same environment across development and production
- **Isolation**: Application runs in its own container
- **Easy Updates**: Pull and restart for new versions
- **Portability**: Run anywhere Docker is supported

---

## Docker Images

### Available Tags

| Tag              | Description                    | Use Case                 |
| ---------------- | ------------------------------ | ------------------------ |
| `latest`         | Most recent release            | Development/Testing      |
| `stable`         | Verified stable release        | Production (recommended) |
| `v1.2.3`         | Specific version               | Production (pinned)      |
| `v1.2`           | Minor version                  | Auto-patch updates       |
| `v1`             | Major version                  | Auto-minor updates       |
| `1.2.3-YYYYMMDD` | Dated release                  | Audit/Rollback           |
| `edge`           | Bleeding edge (develop branch) | Testing only             |

### Pulling Images

```bash
# Latest stable
docker pull ghcr.io/jr33d/secret-santa:stable

# Specific version (recommended for production)
docker pull ghcr.io/jr33d/secret-santa:v1.2.3

# Latest (may be unstable)
docker pull ghcr.io/jr33d/secret-santa:latest
```

---

## Deployment Methods

### Method 1: Docker Run (Simple)

Best for: Quick deployments, testing, single server

```bash
docker run -d \
  --name secret-santa \
  -p 3000:3000 \
  -v secret-santa-data:/app/data \
  -e NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  -e ADMIN_PASSWORD=your_secure_password \
  -e DOMAIN=https://santa.example.com \
  --restart unless-stopped \
  ghcr.io/jr33d/secret-santa:stable
```

### Method 2: Docker Compose (Recommended)

Best for: Production, persistent configuration, easier management

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
 secret-santa:
  image: ghcr.io/jr33d/secret-santa:stable
  container_name: secret-santa
  ports:
   - '3000:3000'
  volumes:
   - secret-santa-data:/app/data
  environment:
   - NODE_ENV=production
   - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
   - NEXTAUTH_URL=https://santa.example.com
   - DOMAIN=https://santa.example.com
   - ADMIN_USERNAME=admin
   - ADMIN_PASSWORD=${ADMIN_PASSWORD}
   - SMTP_SERVER=${SMTP_SERVER}
   - SMTP_PORT=587
   - SMTP_USERNAME=${SMTP_USERNAME}
   - SMTP_PASSWORD=${SMTP_PASSWORD}
   - FROM_EMAIL=${FROM_EMAIL}
  restart: unless-stopped
  healthcheck:
   test: ['CMD', 'node', '-e', "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
   interval: 30s
   timeout: 10s
   retries: 3
   start_period: 40s

volumes:
 secret-santa-data:
  driver: local
```

Create `.env` file:

```env
NEXTAUTH_SECRET=your-generated-secret-here
ADMIN_PASSWORD=your_secure_password
SMTP_SERVER=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@example.com
```

Start application:

```bash
docker-compose up -d
```

### Method 3: Docker Secrets (Most Secure)

Best for: Production with sensitive data, Docker Swarm

Create secret files:

```bash
mkdir -p secrets
echo "your-nextauth-secret" > secrets/nextauth_secret.txt
echo "your-admin-password" > secrets/admin_password.txt
echo "your-smtp-password" > secrets/smtp_password.txt
chmod 600 secrets/*
```

Update `docker-compose.yml`:

```yaml
version: '3.8'

services:
 secret-santa:
  image: ghcr.io/jr33d/secret-santa:stable
  secrets:
   - nextauth_secret
   - admin_password
   - smtp_password
  environment:
   - NEXTAUTH_SECRET_FILE=/run/secrets/nextauth_secret
   - ADMIN_PASSWORD_FILE=/run/secrets/admin_password
   - SMTP_PASSWORD_FILE=/run/secrets/smtp_password
  # ... other configuration

secrets:
 nextauth_secret:
  file: ./secrets/nextauth_secret.txt
 admin_password:
  file: ./secrets/admin_password.txt
 smtp_password:
  file: ./secrets/smtp_password.txt
```

---

## Reverse Proxy Setup

### Why Use a Reverse Proxy?

- **HTTPS/TLS**: Secure communication
- **Domain Names**: Use custom domains
- **Load Balancing**: Distribute traffic
- **Rate Limiting**: Protect against abuse

### Nginx

#### Install Nginx

```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### Configuration

Create `/etc/nginx/sites-available/secret-santa`:

```nginx
server {
    listen 80;
    server_name santa.example.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name santa.example.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/santa.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/santa.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Docker Container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    location /api/auth {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://localhost:3000;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/secret-santa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d santa.example.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### Caddy (Automatic HTTPS)

#### Install Caddy

```bash
# Ubuntu/Debian
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main" | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

#### Configuration

Create `/etc/caddy/Caddyfile`:

```caddy
santa.example.com {
    reverse_proxy localhost:3000

    # Automatic HTTPS
    tls {
        protocols tls1.2 tls1.3
    }

    # Security headers
    header {
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
    }

    # Rate limiting
    rate_limit {
        zone login {
            key {remote_host}
            events 5
            window 1m
        }
    }
}
```

Restart Caddy:

```bash
sudo systemctl restart caddy
```

### Traefik (Docker-Native)

Create `docker-compose.yml` with Traefik:

```yaml
version: '3.8'

services:
 traefik:
  image: traefik:v2.10
  container_name: traefik
  command:
   - '--api.insecure=false'
   - '--providers.docker=true'
   - '--providers.docker.exposedbydefault=false'
   - '--entrypoints.web.address=:80'
   - '--entrypoints.websecure.address=:443'
   - '--certificatesresolvers.letsencrypt.acme.tlschallenge=true'
   - '--certificatesresolvers.letsencrypt.acme.email=admin@example.com'
   - '--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json'
  ports:
   - '80:80'
   - '443:443'
  volumes:
   - '/var/run/docker.sock:/var/run/docker.sock:ro'
   - 'letsencrypt:/letsencrypt'
  restart: unless-stopped

 secret-santa:
  image: ghcr.io/jr33d/secret-santa:stable
  container_name: secret-santa
  environment:
   - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
   - NEXTAUTH_URL=https://santa.example.com
   - DOMAIN=https://santa.example.com
   - ADMIN_PASSWORD=${ADMIN_PASSWORD}
  volumes:
   - secret-santa-data:/app/data
  labels:
   - 'traefik.enable=true'
   - 'traefik.http.routers.secret-santa.rule=Host(`santa.example.com`)'
   - 'traefik.http.routers.secret-santa.entrypoints=websecure'
   - 'traefik.http.routers.secret-santa.tls.certresolver=letsencrypt'
   - 'traefik.http.services.secret-santa.loadbalancer.server.port=3000'
  restart: unless-stopped

volumes:
 secret-santa-data:
 letsencrypt:
```

---

## Backup and Restore

### Database Backup

The SQLite database contains all application data.

#### Manual Backup

```bash
# Create backup directory
mkdir -p backups

# Backup with Docker
docker cp secret-santa:/app/data/secret-santa.db ./backups/secret-santa-$(date +%Y%m%d).db

# Backup with Docker Compose
docker-compose exec secret-santa cp /app/data/secret-santa.db /tmp/backup.db
docker cp secret-santa:/tmp/backup.db ./backups/secret-santa-$(date +%Y%m%d).db
```

#### Automated Backups

Create backup script `backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/path/to/backups"
CONTAINER_NAME="secret-santa"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup
docker cp ${CONTAINER_NAME}:/app/data/secret-santa.db \
  ${BACKUP_DIR}/secret-santa-${DATE}.db

# Compress backup
gzip ${BACKUP_DIR}/secret-santa-${DATE}.db

# Remove old backups
find ${BACKUP_DIR} -name "secret-santa-*.db.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup completed: secret-santa-${DATE}.db.gz"
```

Make executable and schedule:

```bash
chmod +x backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
0 2 * * * /path/to/backup.sh
```

#### Cloud Backups

Using rclone to sync to cloud storage:

```bash
# Install rclone
curl https://rclone.org/install.sh | sudo bash

# Configure (follow prompts)
rclone config

# Sync backups to cloud
rclone sync /path/to/backups remote:secret-santa-backups
```

### Restore Database

#### Stop Container

```bash
docker-compose down
```

#### Restore Backup

```bash
# Extract backup if compressed
gunzip backups/secret-santa-20240115.db.gz

# Copy to volume
docker run --rm \
  -v secret-santa-data:/data \
  -v $(pwd)/backups:/backup \
  alpine \
  cp /backup/secret-santa-20240115.db /data/secret-santa.db
```

#### Start Container

```bash
docker-compose up -d
```

### Volume Backup

Backup entire Docker volume:

```bash
# Backup volume
docker run --rm \
  -v secret-santa-data:/data \
  -v $(pwd)/backups:/backup \
  alpine \
  tar czf /backup/volume-backup-$(date +%Y%m%d).tar.gz -C /data .

# Restore volume
docker run --rm \
  -v secret-santa-data:/data \
  -v $(pwd)/backups:/backup \
  alpine \
  tar xzf /backup/volume-backup-20240115.tar.gz -C /data
```

---

## Monitoring

### Health Checks

Built-in health check endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{
	"status": "healthy",
	"timestamp": "2024-01-15T12:00:00.000Z",
	"database": "connected"
}
```

### Docker Health Status

```bash
# Check container health
docker ps
docker inspect secret-santa | grep -A 10 Health

# View health check logs
docker inspect --format='{{json .State.Health}}' secret-santa | jq
```

### Monitoring with Prometheus

Create `prometheus.yml`:

```yaml
global:
 scrape_interval: 15s

scrape_configs:
 - job_name: 'docker'
   static_configs:
    - targets: ['localhost:9090']
```

Add to `docker-compose.yml`:

```yaml
services:
 prometheus:
  image: prom/prometheus
  volumes:
   - ./prometheus.yml:/etc/prometheus/prometheus.yml
   - prometheus-data:/prometheus
  ports:
   - '9090:9090'
  restart: unless-stopped

 grafana:
  image: grafana/grafana
  ports:
   - '3001:3000'
  environment:
   - GF_SECURITY_ADMIN_PASSWORD=admin
  volumes:
   - grafana-data:/var/lib/grafana
  restart: unless-stopped
```

### Log Management

#### View Logs

```bash
# Follow logs
docker-compose logs -f secret-santa

# Last 100 lines
docker-compose logs --tail=100 secret-santa

# Logs since timestamp
docker-compose logs --since 2024-01-15T10:00:00 secret-santa
```

#### Log Rotation

Configure Docker daemon (`/etc/docker/daemon.json`):

```json
{
	"log-driver": "json-file",
	"log-opts": {
		"max-size": "10m",
		"max-file": "3"
	}
}
```

Restart Docker:

```bash
sudo systemctl restart docker
```

#### Centralized Logging

Using Loki:

```yaml
services:
 loki:
  image: grafana/loki:latest
  ports:
   - '3100:3100'
  volumes:
   - loki-data:/loki
  restart: unless-stopped

 promtail:
  image: grafana/promtail:latest
  volumes:
   - /var/log:/var/log
   - /var/lib/docker/containers:/var/lib/docker/containers
   - ./promtail-config.yml:/etc/promtail/config.yml
  command: -config.file=/etc/promtail/config.yml
  restart: unless-stopped
```

---

## Scaling and Performance

### Resource Limits

Set container resource limits in `docker-compose.yml`:

```yaml
services:
 secret-santa:
  image: ghcr.io/jr33d/secret-santa:stable
  deploy:
   resources:
    limits:
     cpus: '1.0'
     memory: 512M
    reservations:
     cpus: '0.5'
     memory: 256M
  # ... other configuration
```

### Multiple Instances (Load Balancing)

For high availability, run multiple instances behind a load balancer:

```yaml
version: '3.8'

services:
 secret-santa-1:
  image: ghcr.io/jr33d/secret-santa:stable
  volumes:
   - secret-santa-data:/app/data
  environment:
   # ... environment variables
  restart: unless-stopped

 secret-santa-2:
  image: ghcr.io/jr33d/secret-santa:stable
  volumes:
   - secret-santa-data:/app/data
  environment:
   # ... environment variables
  restart: unless-stopped

 nginx:
  image: nginx:alpine
  ports:
   - '80:80'
  volumes:
   - ./nginx.conf:/etc/nginx/nginx.conf
  depends_on:
   - secret-santa-1
   - secret-santa-2
  restart: unless-stopped
```

`nginx.conf`:

```nginx
upstream secret-santa {
    least_conn;
    server secret-santa-1:3000;
    server secret-santa-2:3000;
}

server {
    listen 80;

    location / {
        proxy_pass http://secret-santa;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Performance Tuning

#### Database Optimization

SQLite performance tips:

- Regular VACUUM operations
- Enable WAL mode
- Optimize indexes

Add maintenance script:

```bash
#!/bin/bash
docker-compose exec secret-santa sqlite3 /app/data/secret-santa.db "PRAGMA optimize; VACUUM;"
```

#### Caching

Add Redis for session caching (future enhancement):

```yaml
services:
 redis:
  image: redis:alpine
  volumes:
   - redis-data:/data
  restart: unless-stopped
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs secret-santa

# Check if port is already in use
sudo netstat -tulpn | grep 3000

# Verify environment variables
docker-compose config
```

### Database Locked

```bash
# Stop all containers
docker-compose down

# Check for stale lock files
docker volume inspect secret-santa-data

# Start fresh
docker-compose up -d
```

### Permission Issues

```bash
# Fix volume permissions
docker run --rm \
  -v secret-santa-data:/data \
  alpine \
  chown -R 1001:1001 /data
```

### Health Check Failing

```bash
# Test health endpoint manually
docker-compose exec secret-santa curl http://localhost:3000/api/health

# Check database connectivity
docker-compose exec secret-santa sqlite3 /app/data/secret-santa.db "SELECT 1;"
```

---

## Security Best Practices

### Container Security

1. **Run as non-root** (already configured)
2. **Read-only filesystem** where possible
3. **Drop unnecessary capabilities**
4. **Scan images for vulnerabilities**

```bash
# Scan image
docker scan ghcr.io/jr33d/secret-santa:stable
```

### Network Security

1. **Use custom networks**
2. **Isolate containers**
3. **Enable firewall**

```yaml
services:
 secret-santa:
  networks:
   - secret-santa-network

networks:
 secret-santa-network:
  driver: bridge
```

### Secrets Management

Never commit secrets to version control:

```bash
# Use .gitignore
echo ".env" >> .gitignore
echo "secrets/" >> .gitignore

# Use environment variables
export $(cat .env | xargs)

# Or use Docker secrets
docker secret create my_secret ./secret_file
```

---

## Maintenance

### Updating

```bash
# Pull latest image
docker-compose pull

# Restart with new image
docker-compose up -d

# Clean old images
docker image prune -a
```

### Database Maintenance

```bash
# Optimize database monthly
docker-compose exec secret-santa sqlite3 /app/data/secret-santa.db "PRAGMA optimize; PRAGMA wal_checkpoint(TRUNCATE);"
```

### Log Cleanup

```bash
# Clean old logs
docker-compose logs --tail=0 secret-santa

# Prune system
docker system prune -a --volumes
```

---

## Advanced Topics

### Custom Builds

Build your own image:

```bash
# Clone repository
git clone https://github.com/JR33D/secret-santa.git
cd secret-santa

# Build image
docker build -t my-secret-santa:custom .

# Use custom image
docker run -d my-secret-santa:custom
```

### Multi-Stage Deployments

Separate dev, staging, and production:

```bash
# Development
docker-compose -f docker-compose.dev.yml up

# Staging
docker-compose -f docker-compose.staging.yml up

# Production
docker-compose -f docker-compose.prod.yml up
```

---

## Getting Help

- [Installation Guide](installation.md)
- [Troubleshooting Guide](troubleshooting.md)
- [GitHub Issues](https://github.com/JR33D/secret-santa/issues)
