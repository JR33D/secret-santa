import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
	try {
		const db = await getDb();
		const pools = await db.all(`
      SELECT 
        p.*,
        COUNT(people.id) as member_count
      FROM pools p
      LEFT JOIN people ON people.pool_id = p.id
      GROUP BY p.id
      ORDER BY p.name
    `);
		return NextResponse.json(pools);
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const { name, description } = await request.json();

		if (!name) {
			return NextResponse.json({ error: 'Name is required' }, { status: 400 });
		}

		const db = await getDb();
		const result = await db.run('INSERT INTO pools (name, description) VALUES (?, ?)', [name, description || '']);

		return NextResponse.json({
			id: result.lastID,
			name,
			description,
			message: 'Pool created successfully',
		});
	} catch (error: any) {
		if (error.message.includes('UNIQUE')) {
			return NextResponse.json({ error: 'Pool name already exists' }, { status: 400 });
		}
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
