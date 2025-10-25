import { getDb } from '@/lib/db';

export async function GET() {
	const db = await getDb();
	const rows = await db.all(`
    SELECT r.id, r.giver_id, r.receiver_id, g.name as giver_name, rec.name as receiver_name
    FROM restrictions r
    JOIN people g ON r.giver_id = g.id
    JOIN people rec ON r.receiver_id = rec.id
  `);
	return Response.json(rows, { status: 200 });
}

export async function POST(req: Request) {
	const db = await getDb();
	const { giver_id, receiver_id } = await req.json();
	const result = await db.run('INSERT INTO restrictions (giver_id, receiver_id) VALUES (?, ?)', [giver_id, receiver_id]);
	return Response.json({ id: result.lastID, giver_id, receiver_id }, { status: 200 });
}
