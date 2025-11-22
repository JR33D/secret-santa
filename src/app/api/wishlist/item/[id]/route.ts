import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(
	req: NextRequest,
	context: { params: Promise<{ id: string }> }
) {
	const { id } = await context.params;
	const db = await getDb();

	await db.run('DELETE FROM wishlist_items WHERE id = ?', [id]);

	return Response.json({ success: true }, { status: 200 });
}
