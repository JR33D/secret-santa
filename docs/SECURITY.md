# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please send an email to [INSERT SECURITY EMAIL] with the following information:

- Type of issue (e.g. buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours.
- **Assessment**: We will assess the vulnerability and determine its impact and severity.
- **Fix Development**: We will work on a fix and keep you informed of our progress.
- **Disclosure**: Once a fix is available, we will:
  1. Release a security patch
  2. Publish a security advisory
  3. Credit you for the discovery (unless you prefer to remain anonymous)

### Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Target**: Within 30 days for critical issues, 90 days for others

## Security Best Practices

When deploying Secret Santa App, we recommend:

### Environment Variables
- **Never commit** `.env` files to version control
- Use strong, randomly generated secrets for `NEXTAUTH_SECRET`
- Change default admin passwords immediately
- Rotate secrets regularly

### Docker Deployment
- Use specific version tags instead of `latest` in production
- Run containers as non-root users (already configured)
- Keep base images updated
- Use Docker secrets for sensitive data

### Database
- Regular backups of the SQLite database
- Secure file permissions on the database file
- Consider encryption at rest for sensitive deployments

### Network Security
- Use HTTPS/TLS in production (reverse proxy required)
- Implement rate limiting at the reverse proxy level
- Use firewall rules to restrict access

### SMTP Configuration
- Use app-specific passwords, not account passwords
- Enable 2FA on email accounts
- Use TLS/SSL for SMTP connections
- Validate SMTP credentials before saving

### Access Control
- Limit admin accounts to trusted individuals
- Regular audit of user accounts and permissions
- Remove inactive user accounts

## Known Security Considerations

### Session Management
- Sessions expire after 30 days of inactivity
- JWT tokens are used for session management
- Tokens are httpOnly and secure in production

### Password Storage
- Passwords are hashed using bcrypt with 10 rounds
- Temporary passwords force users to change on first login
- Minimum password length of 8 characters enforced

### Data Privacy
- Email addresses are stored for notification purposes
- No sensitive financial or identity information is collected
- Wishlists and assignments are visible only to authorized users

### Docker Container Security
- Container runs as non-root user (uid 1001)
- Minimal attack surface with alpine-based images
- Health checks implemented
- No unnecessary capabilities granted

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find similar problems
3. Prepare fixes for all supported versions
4. Release new security patch versions

We aim to disclose vulnerabilities in a coordinated manner, allowing users time to update before public disclosure.

## Security Updates

Security updates will be released as:
- Patch versions (e.g., 1.0.1) for minor issues
- Minor versions (e.g., 1.1.0) for moderate issues
- With `SECURITY.md` updates in the CHANGELOG

Subscribe to releases and security advisories on GitHub to stay informed.

## Comments on This Policy

If you have suggestions on how this process could be improved, please submit a pull request or open an issue to discuss.

---

Thank you for helping keep Secret Santa App and its users safe!