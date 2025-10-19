import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	try {
		const db = await getDb();
		const poolId = parseInt(params.id);

		// Check if pool has people
		const peopleCount = await db.get('SELECT COUNT(*) as count FROM people WHERE pool_id = ?', [poolId]);

		if (peopleCount.count > 0) {
			return NextResponse.json({ error: 'Cannot delete pool with people in it. Remove or reassign people first.' }, { status: 400 });
		}

		await db.run('DELETE FROM pools WHERE id = ?', [poolId]);

		return NextResponse.json({ message: 'Pool deleted successfully' });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
	try {
		const { name, description } = await request.json();
		const db = await getDb();
		const poolId = parseInt(params.id);

		await db.run('UPDATE pools SET name = ?, description = ? WHERE id = ?', [name, description, poolId]);

		return NextResponse.json({ message: 'Pool updated successfully' });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
