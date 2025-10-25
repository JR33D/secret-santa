import { getDb } from '@/lib/db';

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const poolId = searchParams.get('pool_id');

		const db = await getDb();

		let query = `
      SELECT 
        people.*,
        pools.name as pool_name
      FROM people
      LEFT JOIN pools ON people.pool_id = pools.id
    `;

		const params: any[] = [];

		if (poolId) {
			query += ' WHERE people.pool_id = ?';
			params.push(parseInt(poolId));
		}

		query += ' ORDER BY people.name';

	const people = await db.all(query, params);
	return Response.json(people, { status: 200 });
	} catch (error: any) {
	return Response.json({ error: error.message }, { status: 500 });
	}
}

export async function POST(request: Request) {
	try {
		const { name, email, pool_id } = await request.json();

		if (!name || !email) {
			return Response.json({ error: 'Name and email are required' }, { status: 400 });
		}

		if (!pool_id) {
			return Response.json({ error: 'Pool is required. Please create a pool first.' }, { status: 400 });
		}

		const db = await getDb();

		// Check if pool exists
		const pool = await db.get('SELECT id FROM pools WHERE id = ?', [pool_id]);
		if (!pool) {
			return Response.json({ error: 'Invalid pool selected' }, { status: 400 });
		}

		const result = await db.run('INSERT INTO people (name, email, pool_id) VALUES (?, ?, ?)', [name, email, pool_id]);

		return Response.json({
			id: result.lastID,
			name,
			email,
			pool_id,
			message: 'Person added successfully',
		}, { status: 200 });
	} catch (error: any) {
	return Response.json({ error: error.message }, { status: 500 });
	}
}
