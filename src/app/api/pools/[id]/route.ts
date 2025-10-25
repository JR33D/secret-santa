import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	try {
		const db = await getDb();
		const poolId = parseInt(params.id);

		// Check if pool has people
		const peopleCount = await db.get('SELECT COUNT(*) as count FROM people WHERE pool_id = ?', [poolId]);

		if (peopleCount.count > 0) {
			return { status: 400, json: async () => ({ error: 'Cannot delete pool with people in it. Remove or reassign people first.' }) } as any;
		}

		await db.run('DELETE FROM pools WHERE id = ?', [poolId]);

		return { status: 200, json: async () => ({ message: 'Pool deleted successfully' }) } as any;
	} catch (error: any) {
			return { status: 500, json: async () => ({ error: error.message }) } as any;
	}
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
	try {
		const { name, description } = await request.json();
		const db = await getDb();
		const poolId = parseInt(params.id);

		await db.run('UPDATE pools SET name = ?, description = ? WHERE id = ?', [name, description, poolId]);

	  return { status: 200, json: async () => ({ message: 'Pool updated successfully' }) } as any;
	} catch (error: any) {
	  return { status: 500, json: async () => ({ error: error.message }) } as any;
	}
}
