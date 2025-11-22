import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params;
		const session = await getServerSession(authOptions);

		if (!session || session?.user?.role !== 'admin') {
			return Response.json({ error: 'Unauthorized' }, { status: 403 });
		}

		const db = await getDb();
		const userId = parseInt(id);

		// Prevent deleting own account
		if (session?.user?.id === String(userId)) {
			return Response.json({ error: 'Cannot delete your own account' }, { status: 400 });
		}

		// Check if user exists
		const user = await db.get('SELECT role FROM users WHERE id = ?', [userId]);
		if (!user) {
			return Response.json({ error: 'User not found' }, { status: 404 });
		}

		// Prevent deleting the last admin
		if (user.role === 'admin') {
			const adminCount = await db.get(
				"SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
			);

			if (adminCount.count <= 1) {
				return Response.json(
					{ error: 'Cannot delete the last admin user' },
					{ status: 400 }
				);
			}
		}

		await db.run('DELETE FROM users WHERE id = ?', [userId]);

		return Response.json({ message: 'User deleted successfully' }, { status: 200 });
	} catch (error: unknown) {
		return Response.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
	}
}
