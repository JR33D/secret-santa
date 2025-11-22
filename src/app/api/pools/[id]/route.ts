import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;
		const poolId = parseInt(id);
		const db = await getDb();

		// Check if pool has people
		const peopleCount = await db.get('SELECT COUNT(*) as count FROM people WHERE pool_id = ?', [poolId]);

		if (peopleCount.count > 0) {
			return Response.json(
				{
					error: 'Cannot delete pool with people in it. Remove or reassign people first.',
				},
				{ status: 400 },
			);
		}

		await db.run('DELETE FROM pools WHERE id = ?', [poolId]);

		return Response.json({ message: 'Pool deleted successfully' }, { status: 200 });
	} catch (error: unknown) {
		return Response.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await context.params;
		const poolId = parseInt(id);

		const { name, description } = await request.json();
		const db = await getDb();

		await db.run('UPDATE pools SET name = ?, description = ? WHERE id = ?', [name, description, poolId]);

		return Response.json({ message: 'Pool updated successfully' }, { status: 200 });
	} catch (error: unknown) {
		return Response.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
	}
}
