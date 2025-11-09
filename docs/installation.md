# Installation Guide

This guide will help you set up the Secret Santa application using various deployment methods.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Method 1: Docker (Recommended)](#method-1-docker-recommended)
- [Method 2: Docker Compose](#method-2-docker-compose)
- [Method 3: Local Development](#method-3-local-development)
- [Initial Setup](#initial-setup)
- [Verification](#verification)
- [Next Steps](#next-steps)

---

## Prerequisites

### For Docker Deployment

- **Docker**: Version 20.10 or later
- **Docker Compose**: Version 2.0 or later (optional, for Method 2)
- **Operating System**: Linux, macOS, or Windows with WSL2

### For Local Development

- **Node.js**: Version 18.x or later
- **npm**: Version 8.x or later
- **Operating System**: Linux, macOS, or Windows

---

## Method 1: Docker (Recommended)

This is the simplest method for production deployments.

### Quick Start

```bash
# Pull and run the latest image
docker run -d \
  --name secret-santa \
  -p 3000:3000 \
  -v secret-santa-data:/app/data \
  -e NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  -e ADMIN_PASSWORD=changeme123 \
  ghcr.io/jr33d/secret-santa:latest
```

### Access the Application

Visit http://localhost:3000

**Default Login:**

- Username: `admin`
- Password: `changeme123` (change immediately!)

### Environment Variables

Required:

- `NEXTAUTH_SECRET` - Secret for session encryption (generate with `openssl rand -base64 32`)
- `ADMIN_PASSWORD` - Initial admin password

Optional:

- `ADMIN_USERNAME` - Admin username (default: `admin`)
- `NEXTAUTH_URL` - Base URL (default: `http://localhost:3000`)
- `DOMAIN` - Domain for email links (default: `http://localhost:3000`)
- `SMTP_SERVER` - SMTP server for email notifications
- `SMTP_PORT` - SMTP port (default: `587`)
- `SMTP_USERNAME` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `FROM_EMAIL` - From email address for notifications

### Complete Example

```bash
docker run -d \
  --name secret-santa \
  -p 3000:3000 \
  -v secret-santa-data:/app/data \
  -e NEXTAUTH_SECRET=$(openssl rand -base64 32) \
  -e NEXTAUTH_URL=https://santa.example.com \
  -e DOMAIN=https://santa.example.com \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=your_secure_password \
  -e SMTP_SERVER=smtp.gmail.com \
  -e SMTP_PORT=587 \
  -e SMTP_USERNAME=your-email@gmail.com \
  -e SMTP_PASSWORD=your-app-password \
  -e FROM_EMAIL=noreply@example.com \
  --restart unless-stopped \
  ghcr.io/jr33d/secret-santa:latest
```

---

## Method 2: Docker Compose

Best for production deployments with persistent configuration.

### Step 1: Create Project Directory

```bash
mkdir secret-santa
cd secret-santa
```

### Step 2: Download Configuration Files

```bash
# Download production docker-compose file
curl -O https://raw.githubusercontent.com/JR33D/secret-santa/main/docker-compose.prod.yml

# Rename to docker-compose.yml
mv docker-compose.prod.yml docker-compose.yml

# Download environment template
curl -O https://raw.githubusercontent.com/JR33D/secret-santa/main/.env.example

# Create your .env file
cp .env.example .env
```

### Step 3: Configure Environment

Edit the `.env` file:

```bash
# Required - Generate secure secrets
NEXTAUTH_SECRET=$(openssl rand -base64 32)
ADMIN_PASSWORD=your_secure_password

# Optional - Email configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@example.com

# Optional - Domain configuration
DOMAIN=https://santa.example.com
NEXTAUTH_URL=https://santa.example.com
```

### Step 4: Start the Application

```bash
# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down

# Stop and remove data
docker-compose down -v
```

### Docker Compose Commands

```bash
# View running containers
docker-compose ps

# Restart the application
docker-compose restart

# Update to latest version
docker-compose pull
docker-compose up -d

# View logs
docker-compose logs -f secret-santa

# Execute commands in container
docker-compose exec secret-santa sh
```

---

## Method 3: Local Development

For development or testing without Docker.

### Step 1: Clone Repository

```bash
git clone https://github.com/JR33D/secret-santa.git
cd secret-santa
```

### Step 2: Install Dependencies

```bash
# Using npm
npm ci

# Or using npm install for development
npm install
```

### Step 3: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

Minimum required configuration:

```env
NEXTAUTH_SECRET=your-secret-here
ADMIN_PASSWORD=changeme123
NEXTAUTH_URL=http://localhost:3000
DOMAIN=http://localhost:3000
```

### Step 4: Run Development Server

```bash
# Start development server
npm run dev

# Server will start on http://localhost:3000
```

### Step 5: Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

---

## Initial Setup

After installation, complete these steps:

### 1. First Login

Navigate to http://localhost:3000

- Username: `admin` (or your custom `ADMIN_USERNAME`)
- Password: Your `ADMIN_PASSWORD`

### 2. Change Admin Password

1. Click on your username in the top-right corner
2. Select "Change Password"
3. Enter current password and new password
4. Save changes

### 3. Create Your First Pool

1. Navigate to the "Pools" tab
2. Click "Create Pool"
3. Enter pool name (e.g., "Family 2024")
4. Add optional description
5. Click "Create Pool"

### 4. Add People

1. Navigate to the "People" tab
2. For each person:
   - Enter their name
   - Enter their email address (required for notifications)
   - Select the pool
   - Click "Add Person"

### 5. Configure Email (Optional)

If you didn't set email environment variables during installation it will not send emails.
The SMTP settings can only be set with the environment variables.

---

## Verification

### Health Check

Visit http://localhost:3000/api/health

Expected response:

```json
{
	"status": "healthy",
	"timestamp": "2024-01-15T12:00:00.000Z",
	"database": "connected"
}
```

### Database Location

**Docker:**

- Data persists in the `secret-santa-data` volume
- Check with: `docker volume inspect secret-santa-data`

**Local Development:**

- Database file: `./data/secret-santa.db`
- Ensure this directory exists

### Logs

**Docker:**

```bash
docker logs secret-santa -f
```

**Docker Compose:**

```bash
docker-compose logs -f
```

**Local Development:**
Check terminal output where `npm run dev` or `npm start` is running.

---

## Next Steps

- [User Guide](user-guide.md) - Learn how to use the application
- [Docker Deployment](docker.md) - Advanced Docker configurations
- [Troubleshooting](troubleshooting.md) - Common issues and solutions

---

## Security Recommendations

### Production Deployments

1. **Use HTTPS**: Deploy behind a reverse proxy (nginx, Caddy, Traefik)
2. **Secure Secrets**: Use Docker secrets or environment management
3. **Regular Updates**: Keep the application and Docker images updated
4. **Backup Database**: Regularly backup the SQLite database
5. **Strong Passwords**: Use strong, unique passwords
6. **Firewall**: Restrict access to the application port

### Email Security

- Use app-specific passwords, not account passwords
- Enable 2FA on email accounts
- Use dedicated email accounts for notifications

---

## Updating

### Docker

```bash
# Stop and remove old container
docker stop secret-santa
docker rm secret-santa

# Pull latest image
docker pull ghcr.io/jr33d/secret-santa:latest

# Start new container (use same command as installation)
docker run -d ...
```

### Docker Compose

```bash
# Pull latest image
docker-compose pull

# Restart with new image
docker-compose up -d
```

### Local Development

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Rebuild
npm run build

# Restart
npm start
```

---

## Uninstalling

### Docker

```bash
# Stop and remove container
docker stop secret-santa
docker rm secret-santa

# Remove image
docker rmi ghcr.io/jr33d/secret-santa:latest

# Remove data volume (WARNING: This deletes all data!)
docker volume rm secret-santa-data
```

### Docker Compose

```bash
# Stop and remove everything including volumes
docker-compose down -v

# Remove project directory
cd ..
rm -rf secret-santa
```

### Local Development

```bash
# Remove project directory
rm -rf secret-santa
```
