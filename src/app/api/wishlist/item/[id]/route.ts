import { getDb } from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
	const db = await getDb();
	await db.run('DELETE FROM wishlist_items WHERE id = ?', [params.id]);
	return Response.json({ success: true }, { status: 200 });
}
