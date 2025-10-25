import { NextResponse } from 'next/server';
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
		return { status: 200, json: async () => people } as any;
	} catch (error: any) {
		return { status: 500, json: async () => ({ error: error.message }) } as any;
	}
}

export async function POST(request: Request) {
	try {
		const { name, email, pool_id } = await request.json();

		if (!name || !email) {
			return { status: 400, json: async () => ({ error: 'Name and email are required' }) } as any;
		}

		if (!pool_id) {
			return { status: 400, json: async () => ({ error: 'Pool is required. Please create a pool first.' }) } as any;
		}

		const db = await getDb();

		// Check if pool exists
		const pool = await db.get('SELECT id FROM pools WHERE id = ?', [pool_id]);
		if (!pool) {
			return { status: 400, json: async () => ({ error: 'Invalid pool selected' }) } as any;
		}

		const result = await db.run('INSERT INTO people (name, email, pool_id) VALUES (?, ?, ?)', [name, email, pool_id]);

		return { status: 200, json: async () => ({
			id: result.lastID,
			name,
			email,
			pool_id,
			message: 'Person added successfully',
		}) } as any;
	} catch (error: any) {
		return { status: 500, json: async () => ({ error: error.message }) } as any;
	}
}
