import { getDb } from '@/lib/db';
import { hashPassword, generatePassword } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import nodemailer from 'nodemailer';
import { getEnvEmailConfig, isEmailConfigValid } from '@/lib/email-config';

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session || (session.user as any).role !== 'admin') {
			return Response.json({ error: 'Unauthorized' }, { status: 403 });
		}

		const db = await getDb();
		const users = await db.all(`
      SELECT 
        u.id,
        u.username,
        u.role,
        u.person_id,
        u.must_change_password,
        u.created_at,
        p.name as person_name,
        p.email as person_email
      FROM users u
      LEFT JOIN people p ON u.person_id = p.id
      ORDER BY u.role DESC, u.username
    `);

		return Response.json(users, { status: 200 });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session || (session.user as any).role !== 'admin') {
			return Response.json({ error: 'Unauthorized' }, { status: 403 });
		}

		const { person_id } = await request.json();

		if (!person_id) {
			return Response.json({ error: 'Person ID is required' }, { status: 400 });
		}

		const db = await getDb();

		// Get person details
		const person = await db.get('SELECT * FROM people WHERE id = ?', [person_id]);

		if (!person) {
			return Response.json({ error: 'Person not found' }, { status: 404 });
		}

		// Check if user already exists for this person
		const existingUser = await db.get('SELECT id FROM users WHERE person_id = ?', [person_id]);

		if (existingUser) {
			return Response.json({ error: 'User already exists for this person' }, { status: 400 });
		}

		// Generate username from person's name (lowercase, no spaces)
		const baseUsername = person.name.toLowerCase().replace(/\s+/g, '');

		// Check if username exists, add number if needed
		let username = baseUsername;
		let counter = 1;
		while (await db.get('SELECT id FROM users WHERE username = ?', [username])) {
			username = `${baseUsername}${counter}`;
			counter++;
		}

		// Generate temporary password
		const tempPassword = generatePassword();
		const passwordHash = await hashPassword(tempPassword);

		// Create user
		const result = await db.run(
			`INSERT INTO users (username, password_hash, role, person_id, must_change_password) 
       VALUES (?, ?, 'user', ?, 1)`,
			[username, passwordHash, person_id],
		);

		// Try to send email with credentials
		let emailSent = false;
		let emailError = '';

		try {
			const { getEmailHtml, getEmailSubject } = await import('@/lib/email-templates');
			const envCfg = getEnvEmailConfig();
			if (isEmailConfigValid(envCfg)) {
				const transporter = nodemailer.createTransport({
					host: envCfg!.smtp_server,
					port: envCfg!.smtp_port,
					secure: false,
					auth: {
						user: envCfg!.smtp_username ?? undefined,
						pass: envCfg!.smtp_password ?? undefined,
					},
				});

				const emailHtml = getEmailHtml('user-created', {
					person_name: person.name,
					username: username,
					temp_password: tempPassword,
				});

				const subject = getEmailSubject('user-created', {
					person_name: person.name,
				});

				await transporter.sendMail({
					from: envCfg!.from_email as string,
					to: person.email,
					subject: subject,
					html: emailHtml,
				});

				emailSent = true;
			} else {
				emailError = 'Email not configured (set SMTP_SERVER and FROM_EMAIL in env)';
			}
		} catch (error: any) {
			emailError = error.message || 'Failed to send email';
		}

		return Response.json(
			{
				id: result.lastID,
				username,
				tempPassword,
				person_name: person.name,
				person_email: person.email,
				emailSent,
				emailError,
				message: emailSent ? 'User created and credentials emailed successfully' : 'User created but email failed to send',
			},
			{ status: 200 },
		);
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
