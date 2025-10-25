import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
	try {
		const db = await getDb();
		await db.run('DELETE FROM people WHERE id = ?', [params.id]);
		return { status: 200, json: async () => ({ success: true }) } as any;
	} catch (error: any) {
		return { status: 500, json: async () => ({ error: error.message }) } as any;
	}
}
