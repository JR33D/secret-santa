import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { compare } from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { currentPassword, newPassword } = await request.json();

		if (!currentPassword || !newPassword) {
			return Response.json({ error: 'Current and new password are required' }, { status: 400 });
		}

		if (newPassword.length < 8) {
			return Response.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
		}

		const db = await getDb();
		const userId = (session.user as any).id;

		// Get current password hash
		const user = await db.get('SELECT password_hash FROM users WHERE id = ?', [userId]);

		if (!user) {
			return Response.json({ error: 'User not found' }, { status: 404 });
		}

		// Verify current password
		const isValid = await compare(currentPassword, user.password_hash);
		if (!isValid) {
			return Response.json({ error: 'Current password is incorrect' }, { status: 400 });
		}

		// Hash new password and update
		const newPasswordHash = await hashPassword(newPassword);
		await db.run('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', [newPasswordHash, userId]);

		return Response.json({ message: 'Password changed successfully' }, { status: 200 });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
