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
		return Response.json(pools, { status: 200 });
	} catch (error: unknown) {
		return Response.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const { name, description } = await request.json();

		if (!name) {
			return Response.json({ error: 'Name is required' }, { status: 400 });
		}

		const db = await getDb();
		const result = await db.run('INSERT INTO pools (name, description) VALUES (?, ?)', [name, description || '']);

		return Response.json(
			{
				id: result.lastID,
				name,
				description,
				message: 'Pool created successfully',
			},
			{ status: 200 },
		);
	} catch (error: unknown) {
		if (error instanceof Error && error.message.includes('UNIQUE')) {
			return Response.json({ error: 'Pool name already exists' }, { status: 400 });
		}
		return Response.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
	}
}
