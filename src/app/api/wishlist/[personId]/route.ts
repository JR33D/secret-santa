import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { personId: string } }) {
	const db = await getDb();
	const rows = await db.all('SELECT * FROM wishlist_items WHERE person_id = ?', [params.personId]);
	return { status: 200, json: async () => rows } as any;
}

export async function POST(req: Request, { params }: { params: { personId: string } }) {
	const db = await getDb();
	const { item_name, link, image_url } = await req.json();
	const result = await db.run('INSERT INTO wishlist_items (person_id, item_name, link, image_url) VALUES (?, ?, ?, ?)', [params.personId, item_name, link || null, image_url || null]);
	return { status: 200, json: async () => ({ id: result.lastID, item_name, link, image_url }) } as any;
}
