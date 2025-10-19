import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
	const db = await getDb();
	await db.run('DELETE FROM people WHERE id = ?', [params.id]);
	return NextResponse.json({ success: true });
}
