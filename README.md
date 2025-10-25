# secret-santa

Application to assist with Family's Secret Santa Tradition.

## Deployment

See `docs/docker_deployment.md` for detailed instructions on building and running the application with Docker and Docker Compose. The repository expects SMTP configuration to be provided via environment variables (`SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `FROM_EMAIL`) — for production we recommend using Docker secrets or your platform's secret manager for sensitive values like `SMTP_PASSWORD` and `NEXTAUTH_SECRET`.
