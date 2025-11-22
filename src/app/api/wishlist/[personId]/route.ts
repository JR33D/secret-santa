import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
	req: NextRequest,
	context: { params: Promise<{ personId: string }> }
) {
	const { personId } = await context.params;
	const db = await getDb();

	const rows = await db.all(
		'SELECT * FROM wishlist_items WHERE person_id = ?',
		[personId]
	);

	return Response.json(rows, { status: 200 });
}

export async function POST(
	req: NextRequest,
	context: { params: Promise<{ personId: string }> }
) {
	const { personId } = await context.params;
	const db = await getDb();
	const { item_name, link, image_url } = await req.json();

	const result = await db.run(
		'INSERT INTO wishlist_items (person_id, item_name, link, image_url) VALUES (?, ?, ?, ?)',
		[personId, item_name, link || null, image_url || null]
	);

	return Response.json(
		{ id: result.lastID, item_name, link, image_url },
		{ status: 200 }
	);
}
