import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const poolId = searchParams.get('pool_id');

		const db = await getDb();

		let query = `
      SELECT 
        a.*,
        g.name as giver_name,
        r.name as receiver_name,
        p.name as pool_name
      FROM assignments a
      JOIN people g ON a.giver_id = g.id
      JOIN people r ON a.receiver_id = r.id
      LEFT JOIN pools p ON a.pool_id = p.id
    `;

		const params: any[] = [];

		if (poolId) {
			query += ' WHERE a.pool_id = ?';
			params.push(parseInt(poolId));
		}

		query += ' ORDER BY a.year DESC, g.name';

		const assignments = await db.all(query, params);
		return NextResponse.json(assignments);
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
