import { getDb } from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
	try {
		const db = await getDb();
		await db.run('DELETE FROM people WHERE id = ?', [params.id]);
		return Response.json({ success: true }, { status: 200 });
	} catch (error: any) {
			return Response.json({ error: error.message }, { status: 500 });
	}
}
