import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hashPassword, generatePassword } from '@/lib/auth';
import nodemailer from 'nodemailer';
import { getEnvEmailConfig, isEmailConfigValid } from '@/lib/email-config';

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	const { id } = await context.params; // ← IMPORTANT

	try {
		const session = await getServerSession(authOptions);
		if (!session || session?.user?.role !== 'admin') {
			return Response.json({ error: 'Unauthorized' }, { status: 403 });
		}

		const db = await getDb();
		const userId = parseInt(id);

		const user = await db.get(
			`SELECT u.*, p.name as person_name, p.email as person_email
       FROM users u
       LEFT JOIN people p ON u.person_id = p.id
       WHERE u.id = ?`,
			[userId]
		);

		if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
		if (!user.person_email)
			return Response.json({ error: 'User has no email address associated' }, { status: 400 });

		const tempPassword = generatePassword();
		const passwordHash = await hashPassword(tempPassword);

		await db.run('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?', [
			passwordHash,
			userId,
		]);

		let emailSent = false;
		let emailError = '';

		try {
			const { getEmailHtml, getEmailSubject } = await import('@/lib/email-templates');
			const envCfg = getEnvEmailConfig();

			if (!isEmailConfigValid(envCfg) || !envCfg) {
				return Response.json(
					{ error: 'Email not configured. Set SMTP_SERVER and FROM_EMAIL in env' },
					{ status: 400 }
				);
			}

			const transporter = nodemailer.createTransport({
				host: envCfg.smtp_server,
				port: envCfg.smtp_port,
				secure: false,
				auth: {
					user: envCfg.smtp_username ?? undefined,
					pass: envCfg.smtp_password ?? undefined,
				},
			});

			const html = getEmailHtml('password-reset', {
				person_name: user.person_name,
				username: user.username,
				temp_password: tempPassword,
				domain: process.env.DOMAIN ?? '',
			});

			const subject = getEmailSubject('password-reset', {
				person_name: user.person_name,
			});

			await transporter.sendMail({
				from: envCfg.from_email!,
				to: user.person_email,
				subject,
				html,
			});

			emailSent = true;
		} catch (err: unknown) {
			emailError = err instanceof Error ? err.message : 'Failed to send email';
		}

		return Response.json(
			{
				username: user.username,
				tempPassword,
				person_name: user.person_name,
				person_email: user.person_email,
				emailSent,
				emailError,
				message: emailSent
					? 'New password generated and emailed successfully'
					: 'New password generated but email failed to send',
			},
			{ status: 200 }
		);
	} catch (error: unknown) {
		return Response.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
	}
}
