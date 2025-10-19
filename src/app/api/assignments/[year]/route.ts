import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { year: string } }) {
	try {
		const db = await getDb();
		const year = parseInt(params.year);
		const { searchParams } = new URL(request.url);
		const poolId = searchParams.get('pool_id');

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
      WHERE a.year = ?
    `;

		const queryParams: any[] = [year];

		if (poolId) {
			query += ' AND a.pool_id = ?';
			queryParams.push(parseInt(poolId));
		}

		query += ' ORDER BY g.name';

		const assignments = await db.all(query, queryParams);
		return NextResponse.json(assignments);
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

export async function DELETE(request: Request, { params }: { params: { year: string } }) {
	try {
		const db = await getDb();
		const year = parseInt(params.year);
		const { searchParams } = new URL(request.url);
		const poolId = searchParams.get('pool_id');

		if (poolId) {
			await db.run('DELETE FROM assignments WHERE year = ? AND pool_id = ?', [year, parseInt(poolId)]);
		} else {
			await db.run('DELETE FROM assignments WHERE year = ?', [year]);
		}

		return NextResponse.json({ message: 'Assignments deleted successfully' });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
