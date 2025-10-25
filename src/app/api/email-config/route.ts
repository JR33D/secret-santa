import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
	const db = await getDb();
	const row = await db.get('SELECT smtp_server, smtp_port, smtp_username, from_email FROM email_config LIMIT 1');
	return { status: 200, json: async () => (row || {}) } as any;
}

export async function POST(req: Request) {
	const db = await getDb();
	const body = await req.json();
	const { smtp_server, smtp_port, smtp_username, smtp_password, from_email } = body;
	const row = await db.get('SELECT id FROM email_config LIMIT 1');
	if (row) {
		await db.run('UPDATE email_config SET smtp_server = ?, smtp_port = ?, smtp_username = ?, smtp_password = ?, from_email = ? WHERE id = ?', [
			smtp_server,
			smtp_port,
			smtp_username,
			smtp_password,
			from_email,
			row.id,
		]);
		return { status: 200, json: async () => ({ success: true }) } as any;
	} else {
		const res = await db.run('INSERT INTO email_config (smtp_server, smtp_port, smtp_username, smtp_password, from_email) VALUES (?, ?, ?, ?, ?)', [
			smtp_server,
			smtp_port,
			smtp_username,
			smtp_password,
			from_email,
		]);
		return { status: 200, json: async () => ({ success: true }) } as any;
	}
}
