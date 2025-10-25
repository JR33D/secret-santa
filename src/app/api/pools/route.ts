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
		return { status: 200, json: async () => pools } as any;
	} catch (error: any) {
		return { status: 500, json: async () => ({ error: error.message }) } as any;
	}
}

export async function POST(request: Request) {
	try {
		const { name, description } = await request.json();

		if (!name) {
			return { status: 400, json: async () => ({ error: 'Name is required' }) } as any;
		}

		const db = await getDb();
		const result = await db.run('INSERT INTO pools (name, description) VALUES (?, ?)', [name, description || '']);

		return { status: 200, json: async () => ({
			id: result.lastID,
			name,
			description,
			message: 'Pool created successfully',
		}) } as any;
	} catch (error: any) {
		if (error.message.includes('UNIQUE')) {
			return { status: 400, json: async () => ({ error: 'Pool name already exists' }) } as any;
		}
		return { status: 500, json: async () => ({ error: error.message }) } as any;
	}
}
