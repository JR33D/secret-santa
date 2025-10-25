import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
	const db = await getDb();
	await db.run('DELETE FROM restrictions WHERE id = ?', [params.id]);
	return { status: 200, json: async () => ({ success: true }) } as any;
}
