import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const poolId = searchParams.get('pool_id');

		const db = await getDb();

		let query = `
      SELECT 
        a.year,
        g.name as giver,
        r.name as receiver
      FROM assignments a
      JOIN people g ON a.giver_id = g.id
      JOIN people r ON a.receiver_id = r.id
    `;

		const params: any[] = [];

		if (poolId) {
			query += ' WHERE a.pool_id = ?';
			params.push(parseInt(poolId));
		}

		const assignments = await db.all(query, params);

		// Extract unique nodes
		const nodesSet = new Set<string>();
		assignments.forEach((a: any) => {
			nodesSet.add(a.giver);
			nodesSet.add(a.receiver);
		});

		const nodes = Array.from(nodesSet);

		const links = assignments.map((a: any) => ({
			year: a.year,
			giver: a.giver,
			receiver: a.receiver,
		}));

		return NextResponse.json({ nodes, links });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
