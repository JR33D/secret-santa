import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
	try {
		const session = await getServerSession(authOptions);
		if (!session) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const personId = searchParams.get('person_id');
		const year = searchParams.get('year');

		if (!personId || !year) {
			return Response.json({ error: 'person_id and year are required' }, { status: 400 });
		}

		// Verify the user is requesting their own assignment
		const userPersonId = (session.user as any).personId;
		if (String(userPersonId) !== personId && (session.user as any).role !== 'admin') {
			return Response.json({ error: 'You can only view your own assignment' }, { status: 403 });
		}

		const db = await getDb();
		const assignments = await db.all(
			`SELECT 
        a.year,
        a.receiver_id,
        r.name as receiver_name,
        r.email as receiver_email
      FROM assignments a
      JOIN people r ON a.receiver_id = r.id
      WHERE a.giver_id = ? AND a.year = ?`,
			[parseInt(personId), parseInt(year)],
		);

		return Response.json(assignments, { status: 200 });
	} catch (error: any) {
		return Response.json({ error: error.message }, { status: 500 });
	}
}
