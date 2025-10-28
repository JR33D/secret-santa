# Troubleshooting Guide

Common issues and solutions for the Secret Santa application.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Authentication Issues](#authentication-issues)
- [Database Issues](#database-issues)
- [Email Issues](#email-issues)
- [Docker Issues](#docker-issues)
- [Assignment Generation Issues](#assignment-generation-issues)
- [Performance Issues](#performance-issues)
- [Network Issues](#network-issues)

---

## Installation Issues

### Port 3000 Already in Use

**Problem:** Cannot start application because port 3000 is occupied.

**Solution:**

```bash
# Check what's using port 3000
sudo lsof -i :3000
# or
sudo netstat -tulpn | grep 3000

# Kill the process
kill -9 <PID>

# Or use a different port
docker run -p 3001:3000 ...
```

### npm install Fails

**Problem:** Dependencies fail to install.

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Try with legacy peer deps
npm install --legacy-peer-deps
```

### Docker Image Pull Fails

**Problem:** Cannot pull Docker image from registry.

**Solutions:**

```bash
# Check Docker is running
docker ps

# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Try different registry mirror
docker pull ghcr.io/jr33d/secret-santa:stable

# Check network connection
ping ghcr.io
```

---

## Authentication Issues

### Cannot Login - Invalid Credentials

**Problem:** Username and password don't work.

**Solutions:**

1. **Verify credentials**
   - Default username: `admin`
   - Check `ADMIN_PASSWORD` environment variable

2. **Reset admin password:**

```bash
# Stop container
docker-compose down

# Start fresh (WARNING: Creates new database)
rm -rf data/secret-santa.db
docker-compose up -d
```

3. **Check environment variables:**

```bash
docker-compose exec secret-santa env | grep ADMIN
```

### Forced to Change Password on Every Login

**Problem:** Password change requirement doesn't clear.

**Solution:**

Check database flag:

```bash
docker-compose exec secret-santa sqlite3 /app/data/secret-santa.db \
  "UPDATE users SET must_change_password = 0 WHERE username = 'admin';"
```

### Session Expires Immediately

**Problem:** Logged out immediately after login.

**Solutions:**

1. **Check NEXTAUTH_SECRET:**

```bash
# Verify it's set
docker-compose exec secret-santa env | grep NEXTAUTH_SECRET

# Generate new one
openssl rand -base64 32
```

2. **Check NEXTAUTH_URL:**

```env
# Must match your actual URL
NEXTAUTH_URL=https://santa.example.com
```

3. **Clear browser cookies:**
   - Open DevTools (F12)
   - Application → Cookies
   - Delete all cookies for the site

### "Unauthorized" Error on API Calls

**Problem:** API returns 401/403 errors.

**Solutions:**

1. **Check user role:**
   - Admin routes require admin role
   - Verify in Users tab

2. **Re-login:**
   - Logout and login again
   - Session may have expired

3. **Check middleware:**

```bash
# View logs for auth errors
docker-compose logs -f | grep "Unauthorized"
```

---

## Database Issues

### Database File Not Found

**Problem:** Application starts but can't find database.

**Solutions:**

1. **Check volume mount:**

```bash
docker volume inspect secret-santa-data
```

2. **Verify DB_DIR:**

```bash
docker-compose exec secret-santa ls -la /app/data/
```

3. **Create database directory:**

```bash
docker run --rm \
  -v secret-santa-data:/data \
  alpine \
  mkdir -p /data
```

### Database Locked Error

**Problem:** "database is locked" error message.

**Solutions:**

1. **Stop all instances:**

```bash
docker-compose down
docker ps | grep secret-santa
```

2. **Check for stale locks:**

```bash
docker run --rm \
  -v secret-santa-data:/data \
  alpine \
  rm -f /data/secret-santa.db-wal /data/secret-santa.db-shm
```

3. **Restart application:**

```bash
docker-compose up -d
```

### Database Corruption

**Problem:** Database appears corrupted.

**Solutions:**

1. **Check database integrity:**

```bash
docker-compose exec secret-santa sqlite3 /app/data/secret-santa.db "PRAGMA integrity_check;"
```

2. **Restore from backup:**

```bash
# Stop application
docker-compose down

# Restore backup
docker run --rm \
  -v secret-santa-data:/data \
  -v $(pwd)/backups:/backup \
  alpine \
  cp /backup/secret-santa-20240115.db /data/secret-santa.db

# Start application
docker-compose up -d
```

3. **Export and reimport data:**

```bash
# Export
docker-compose exec secret-santa sqlite3 /app/data/secret-santa.db .dump > backup.sql

# Reimport to new database
docker-compose exec secret-santa sqlite3 /app/data/secret-santa-new.db < backup.sql
```

---

## Email Issues

### Emails Not Sending

**Problem:** Email notifications fail to send.

**Diagnosis:**

```bash
# Check SMTP configuration
docker-compose exec secret-santa env | grep SMTP

# Test SMTP connection
docker-compose exec secret-santa nc -zv smtp.gmail.com 587
```

**Solutions:**

1. **Verify SMTP credentials:**
   - Use app-specific passwords, not account passwords
   - Enable "Less secure app access" (if applicable)

2. **Check SMTP server:**
   ```env
   SMTP_SERVER=smtp.gmail.com  # Correct
   SMTP_PORT=587                # TLS port
   ```

3. **Gmail specific:**
   - Create app password: https://myaccount.google.com/apppasswords
   - Enable 2FA first

4. **Test with curl:**

```bash
curl -v --url "smtp://smtp.gmail.com:587" \
  --mail-from "from@example.com" \
  --mail-rcpt "to@example.com" \
  --user "username:password"
```

### Emails Go to Spam

**Problem:** Notifications arrive in spam folder.

**Solutions:**

1. **Set proper FROM_EMAIL:**
   ```env
   FROM_EMAIL=noreply@yourdomain.com
   ```

2. **Add SPF record (if using custom domain):**
   ```
   v=spf1 include:_spf.google.com ~all
   ```

3. **Ask users to whitelist** your sending address

### Email Contains Wrong Links

**Problem:** Links in emails point to wrong domain.

**Solution:**

Set DOMAIN variable correctly:

```env
DOMAIN=https://santa.example.com
NEXTAUTH_URL=https://santa.example.com
```

---

## Docker Issues

### Container Keeps Restarting

**Problem:** Container restarts constantly.

**Diagnosis:**

```bash
# Check logs
docker-compose logs --tail=100 secret-santa

# Check exit code
docker inspect secret-santa | grep ExitCode
```

**Solutions:**

1. **Check health endpoint:**

```bash
curl http://localhost:3000/api/health
```

2. **Verify environment variables:**

```bash
docker-compose config
```

3. **Check resource limits:**

```bash
docker stats secret-santa
```

### Out of Disk Space

**Problem:** Docker runs out of disk space.

**Solutions:**

```bash
# Check disk usage
docker system df

# Clean up
docker system prune -a --volumes

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

### Permission Denied Errors

**Problem:** Container cannot write to volumes.

**Solutions:**

```bash
# Fix volume permissions
docker run --rm \
  -v secret-santa-data:/data \
  alpine \
  chown -R 1001:1001 /data

# Or recreate volume
docker-compose down -v
docker-compose up -d
```

### Cannot Connect to Container

**Problem:** Cannot access application on localhost:3000.

**Solutions:**

1. **Check if container is running:**

```bash
docker ps | grep secret-santa
```

2. **Check port binding:**

```bash
docker port secret-santa
```

3. **Test from inside container:**

```bash
docker-compose exec secret-santa curl http://localhost:3000/api/health
```

4. **Check firewall:**

```bash
# Allow port 3000
sudo ufw allow 3000
```

---

## Assignment Generation Issues

### "Cannot Generate Valid Assignments"

**Problem:** Assignment generation fails with this error.

**Cause:** Too many restrictions make valid assignment impossible.

**Solutions:**

1. **Review restrictions:**
   - Navigate to Restrictions tab
   - Remove unnecessary restrictions

2. **Check pool size:**
   - Need at least 2 people
   - More people = more flexibility

3. **Verify restrictions don't create impossible scenarios:**
   ```
   Bad: A → not B, B → not A, only 2 people total
   ```

### Assignments Already Exist

**Problem:** Cannot generate new assignments for the same year.

**Solution:**

Delete existing assignments first:

1. Navigate to Generate tab
2. Select year
3. Click "Delete All"
4. Confirm deletion
5. Generate new assignments

### Someone Assigned to Themselves

**Problem:** Person is assigned to give gift to themselves.

**This shouldn't happen!** If it does:

1. Regenerate assignments
2. If problem persists, report as bug with:
   - Pool configuration
   - Restrictions list
   - Number of people

---

## Performance Issues

### Slow Page Loads

**Problem:** Application responds slowly.

**Solutions:**

1. **Check resource usage:**

```bash
docker stats secret-santa
```

2. **Optimize database:**

```bash
docker-compose exec secret-santa sqlite3 /app/data/secret-santa.db \
  "PRAGMA optimize; VACUUM;"
```

3. **Increase container resources:**

```yaml
services:
  secret-santa:
    deploy:
      resources:
        limits:
          memory: 1G
```

4. **Check logs for errors:**

```bash
docker-compose logs -f | grep error
```

### High Memory Usage

**Problem:** Container uses too much memory.

**Solutions:**

1. **Set memory limits:**

```yaml
deploy:
  resources:
    limits:
      memory: 512M
```

2. **Restart container:**

```bash
docker-compose restart
```

3. **Check for memory leaks:**

```bash
docker stats --no-stream secret-santa
```

---

## Network Issues

### Cannot Access from Another Device

**Problem:** Can access locally but not from other devices.

**Solutions:**

1. **Check firewall:**

```bash
sudo ufw status
sudo ufw allow 3000
```

2. **Bind to 0.0.0.0:**

```yaml
ports:
  - "0.0.0.0:3000:3000"
```

3. **Check network configuration:**

```bash
ip addr show
netstat -tulpn | grep 3000
```

### CORS Errors in Browser

**Problem:** Browser shows CORS errors.

**Solution:**

Ensure NEXTAUTH_URL and DOMAIN match your access URL:

```env
# If accessing via IP
NEXTAUTH_URL=http://192.168.1.100:3000
DOMAIN=http://192.168.1.100:3000

# If using domain
NEXTAUTH_URL=https://santa.example.com
DOMAIN=https://santa.example.com
```

### SSL/TLS Errors

**Problem:** HTTPS not working or certificate errors.

**Solutions:**

1. **Check reverse proxy configuration** (nginx/Caddy/Traefik)

2. **Verify certificate:**

```bash
openssl s_client -connect santa.example.com:443
```

3. **Renew Let's Encrypt certificate:**

```bash
sudo certbot renew
sudo systemctl restart nginx
```

---

## Common Error Messages

### "SQLITE_BUSY: database is locked"

**Cause:** Multiple processes accessing database simultaneously.

**Solution:** Restart application and ensure only one instance running.

### "ECONNREFUSED" when sending email

**Cause:** Cannot connect to SMTP server.

**Solution:** Check SMTP_SERVER and SMTP_PORT, verify network connectivity.

### "Invalid email address"

**Cause:** Email validation failed.

**Solution:** Ensure email format is correct (user@domain.com).

### "Pool not found"

**Cause:** Referenced pool doesn't exist.

**Solution:** Refresh page, recreate pool if necessary.

### "Unauthorized - Admin access required"

**Cause:** User role doesn't have permission.

**Solution:** Login as admin or request admin privileges.

---

## Diagnostic Commands

### Collect Debug Information

```bash
# System info
uname -a
docker --version
docker-compose --version

# Container status
docker ps -a

# Container logs
docker-compose logs --tail=100 secret-santa

# Container inspect
docker inspect secret-santa

# Volume info
docker volume inspect secret-santa-data

# Network info
docker network inspect secret-santa_default

# Resource usage
docker stats --no-stream secret-santa

# Health check
curl http://localhost:3000/api/health

# Database check
docker-compose exec secret-santa sqlite3 /app/data/secret-santa.db \
  "SELECT COUNT(*) FROM people;"
```

### Enable Debug Logging

Add to docker-compose.yml:

```yaml
environment:
  - DEBUG=*
  - NODE_ENV=development
```

---

## Getting More Help

If you can't resolve your issue:

1. **Check existing issues:** [GitHub Issues](https://github.com/JR33D/secret-santa/issues)
2. **Search discussions:** [GitHub Discussions](https://github.com/JR33D/secret-santa/discussions)
3. **Create new issue:** Include:
   - Error messages
   - Steps to reproduce
   - Environment details
   - Relevant logs
   - Configuration (remove secrets!)

### Issue Template

```markdown
## Description
Brief description of the issue

## Environment
- OS: Ubuntu 22.04
- Docker Version: 24.0.5
- Image Version: v1.2.3
- Deployment: Docker Compose

## Steps to Reproduce
1. Step one
2. Step two
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Logs
```
Paste relevant logs here
```

## Configuration (secrets removed)
```yaml
Paste relevant config here
```
```

---

## Prevention Tips

1. **Regular backups:** Automate database backups
2. **Monitor logs:** Check logs regularly for warnings
3. **Keep updated:** Update to latest stable version
4. **Test changes:** Test in non-production environment first
5. **Document setup:** Keep notes on your configuration
6. **Security updates:** Keep Docker and host OS updated

---

## Related Documentation

- [Installation Guide](installation.md)
- [User Guide](user-guide.md)
- [Docker Deployment](docker.md)
- [Development Setup](development.md)