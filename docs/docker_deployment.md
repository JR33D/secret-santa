# Docker Deployment Guide

## Prerequisites

- Docker installed (version 20.10 or higher)
- Docker Compose (optional, for easier management)
- GitHub account with packages write permission

## Local Development with Docker

### Build and Run Locally

```bash
# Build the Docker image
docker build -t secret-santa-app:local .

# Run the container
docker run -d \
  --name secret-santa \
  -p 3000:3000 \
  -v secret-santa-data:/app/data \
  secret-santa-app:local
```

### Using Docker Compose

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop and remove
docker-compose down

# Stop and remove with volumes (deletes database)
docker-compose down -v
```

## CI/CD Pipeline

The GitHub Actions workflow automatically:

1. **On Pull Request**: Tests and builds the app
2. **On Push to Main/Master**: Tests, builds, and publishes to GitHub Container Registry
3. **On Git Tags** (v*.*.\*): Creates versioned releases

### Workflow Triggers

- Push to `main` or `master` branch
- Pull requests to `main` or `master`
- Git tags matching `v*.*.*` (e.g., v1.0.0)
- Manual workflow dispatch

### Container Registry

Images are published to: `ghcr.io/JR33D/YOUR-REPO:latest`

## Pulling and Running Published Images

### From GitHub Container Registry

```bash
# Login to GHCR (use a Personal Access Token with read:packages scope)
echo $GITHUB_TOKEN | docker login ghcr.io -u JR33D --password-stdin

# Pull the latest image
docker pull ghcr.io/JR33D/YOUR-REPO:latest

# Run the container
docker run -d \
  --name secret-santa \
  -p 3000:3000 \
  -v secret-santa-data:/app/data \
  ghcr.io/JR33D/YOUR-REPO:latest
```

## Production Deployment

### Docker Run Command

```bash
docker run -d \
  --name secret-santa \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /path/to/data:/app/data \
  -e NODE_ENV=production \
  ghcr.io/JR33D/YOUR-REPO:latest
```

### Docker Compose for Production

Create a `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
 secret-santa:
  image: ghcr.io/JR33D/YOUR-REPO:latest
  container_name: secret-santa
  ports:
   - '3000:3000'
  volumes:
   - ./data:/app/data
  environment:
   - NODE_ENV=production
   - DB_DIR=/app/data
  restart: unless-stopped
  healthcheck:
   test: ['CMD', 'wget', '--quiet', '--tries=1', '--spider', 'http://localhost:3000']
   interval: 30s
   timeout: 10s
   retries: 3
```

Run with:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Variables

| Variable   | Default                   | Description               |
| ---------- | ------------------------- | ------------------------- |
| `NODE_ENV` | production                | Node environment          |
| `PORT`     | 3000                      | Application port          |
| `DB_DIR`   | /app/data                 | SQLite database directory |
| `DB_PATH`  | /app/data/secret_santa.db | Full database path        |

### SMTP / Email Environment Variables

This project now sources SMTP configuration from environment variables (do not store SMTP credentials in the database).

| Variable       | Default | Description |
| -------------- | ------- | ----------- |
| `SMTP_SERVER`  | (none)  | SMTP host (required in production)
| `SMTP_PORT`    | 587     | SMTP port (defaults to 587)
| `SMTP_USERNAME`| (none)  | Optional SMTP username
| `SMTP_PASSWORD`| (none)  | SMTP password — prefer Docker secrets or CI secrets in production
| `FROM_EMAIL`   | (none)  | The "from" address for outgoing emails (required)

If these variables are not set, email-related API endpoints will return an informative error. Tests and local development can set these variables via a `.env` file or your shell.

### Using Docker secrets for SMTP_PASSWORD (recommended)

For production, avoid passing sensitive secrets via plain environment variables. Use Docker secrets (or your orchestrator's secret manager) and mount them into the container.

Example `docker-compose.prod.yml` snippet (see also `docker-compose.yml` in the repo):

```yaml
services:
  secret-santa:
    image: ghcr.io/YOUR-USERNAME/YOUR-REPO:latest
    environment:
      - NODE_ENV=production
      - DB_DIR=/app/data
      - SMTP_SERVER=smtp.example.com
      - FROM_EMAIL=noreply@example.com
    secrets:
      - smtp_password
      - nextauth_secret
      - admin_password

secrets:
  smtp_password:
    file: ./secrets/smtp_password.txt
  nextauth_secret:
    file: ./secrets/nextauth_secret.txt
  admin_password:
    file: ./secrets/admin_password.txt
```

Inside the container the secret files will be available at `/run/secrets/<name>` — for example `/run/secrets/smtp_password`. If you use this approach you can set `SMTP_PASSWORD` inside the container startup script by reading the file and exporting it as an environment variable before starting the Node process. This keeps secrets out of process listings and Docker inspect output.

Example startup wrapper (simple):

```sh
if [ -f /run/secrets/smtp_password ]; then
  export SMTP_PASSWORD=$(cat /run/secrets/smtp_password)
fi
node server.js
```

Or, if you prefer not to export env vars, adapt the application to read `/run/secrets/smtp_password` directly when building the SMTP transport.


## Data Persistence

The SQLite database is stored in `/app/data` inside the container. **Always** mount this as a volume to persist data between container restarts:

```bash
-v /host/path/data:/app/data
```

## Health Checks

The container includes a health check that runs every 30 seconds:

```bash
# Check container health
docker ps

# View health check logs
docker inspect --format='{{json .State.Health}}' secret-santa | jq
```

## Troubleshooting

### View Logs

```bash
docker logs secret-santa

# Follow logs
docker logs -f secret-santa

# Last 100 lines
docker logs --tail 100 secret-santa
```

### Access Container Shell

```bash
docker exec -it secret-santa sh
```

### Database Access

```bash
# Copy database out of container
docker cp secret-santa:/app/data/secret_santa.db ./backup.db

# Copy database into container
docker cp ./backup.db secret-santa:/app/data/secret_santa.db
```

### Rebuild After Changes

```bash
# Rebuild without cache
docker build --no-cache -t secret-santa-app:local .

# Or with docker-compose
docker-compose build --no-cache
```

## Making GitHub Package Public

By default, GitHub packages are private. To make it public:

1. Go to your repository on GitHub
2. Click "Packages" in the right sidebar
3. Click on your package name
4. Click "Package settings"
5. Scroll down to "Danger Zone"
6. Click "Change visibility"
7. Select "Public"

## Automated Deployments

### Using Watchtower (Auto-update on new images)

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  secret-santa \
  --interval 300
```

This will check for new images every 5 minutes and automatically update your container.

## Security Notes

1. Always use a volume for `/app/data` to prevent data loss
2. Keep your GitHub tokens secure
3. Consider using Docker secrets for production deployments
4. Run containers with read-only root filesystem when possible
5. Regularly update base images and dependencies

## Multi-Architecture Support

The CI/CD pipeline builds for both `amd64` and `arm64` architectures, supporting:

- Intel/AMD servers and desktops
- ARM-based systems (Apple Silicon, Raspberry Pi, AWS Graviton)
