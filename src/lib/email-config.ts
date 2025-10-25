export interface EmailConfig {
	smtp_server: string;
	smtp_port: number;
	smtp_username?: string | null;
	smtp_password?: string | null;
	from_email?: string | null;
}

/**
 * Return email configuration sourced exclusively from environment variables.
 * This repo uses environment-managed secrets for SMTP in container deployments.
 * Returns null when no SMTP_SERVER is configured in the environment.
 */
export function getEnvEmailConfig(): EmailConfig | null {
	const server = process.env.SMTP_SERVER;
	if (!server) return null;

	const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;

	return {
		smtp_server: server,
		smtp_port: port,
		smtp_username: process.env.SMTP_USERNAME ?? null,
		smtp_password: process.env.SMTP_PASSWORD ?? null,
		from_email: process.env.FROM_EMAIL ?? null,
	};
}

/**
 * Validate minimal config required to send email
 */
export function isEmailConfigValid(cfg: EmailConfig | null): boolean {
	if (!cfg) return false;
	if (!cfg.smtp_server) return false;
	if (!cfg.from_email) return false;
	return true;
}
