// Email configuration is managed via environment variables only for this deployment model.
// GET returns the current env values (if present). POST is not allowed — configuration
// must be changed via environment/secret management and redeploy or container update.

export async function GET() {
	if (process.env.SMTP_SERVER) {
		return Response.json(
			{
				smtp_server: process.env.SMTP_SERVER,
				smtp_port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
				smtp_username: process.env.SMTP_USERNAME || null,
				from_email: process.env.FROM_EMAIL || null,
				source: 'env',
			},
			{ status: 200 },
		);
	}
	return Response.json({}, { status: 200 });
}

export async function POST() {
	return Response.json({ error: 'Email configuration is managed via environment variables in this deployment; POST is disabled.' }, { status: 403 });
}
