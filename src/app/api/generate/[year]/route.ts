import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request, { params }: { params: { year: string } }) {
	try {
		const db = await getDb();
		const year = parseInt(params.year);
		const { searchParams } = new URL(request.url);
		const poolId = searchParams.get('pool_id');

		if (!poolId) {
			return NextResponse.json({ error: 'Pool ID is required' }, { status: 400 });
		}

		// Get all people in this pool
		const people = await db.all('SELECT * FROM people WHERE pool_id = ? ORDER BY id', [parseInt(poolId)]);

		if (people.length < 2) {
			return NextResponse.json({ success: false, message: 'Need at least 2 people in the pool to generate assignments' }, { status: 400 });
		}

		// Check if assignments already exist for this year and pool
		const existing = await db.get('SELECT COUNT(*) as count FROM assignments WHERE year = ? AND pool_id = ?', [year, parseInt(poolId)]);

		if (existing.count > 0) {
			return NextResponse.json({ success: false, message: `Assignments for ${year} in this pool already exist. Delete them first if you want to regenerate.` }, { status: 400 });
		}

		// Get restrictions for this pool
		const restrictions = await db.all(
			`
      SELECT r.giver_id, r.receiver_id 
      FROM restrictions r
      JOIN people g ON r.giver_id = g.id
      JOIN people rec ON r.receiver_id = rec.id
      WHERE g.pool_id = ? AND rec.pool_id = ?
    `,
			[parseInt(poolId), parseInt(poolId)],
		);

		const restrictionMap = new Map<number, Set<number>>();
		restrictions.forEach((r: any) => {
			if (!restrictionMap.has(r.giver_id)) {
				restrictionMap.set(r.giver_id, new Set());
			}
			restrictionMap.get(r.giver_id)!.add(r.receiver_id);
		});

		// Generate assignments
		const assignments = generateAssignments(people, restrictionMap);

		if (!assignments) {
			return NextResponse.json({ success: false, message: 'Could not generate valid assignments with current restrictions. Try adjusting restrictions.' }, { status: 400 });
		}

		// Save assignments
		for (const [giverId, receiverId] of assignments) {
			await db.run('INSERT INTO assignments (year, giver_id, receiver_id, pool_id) VALUES (?, ?, ?, ?)', [year, giverId, receiverId, parseInt(poolId)]);
		}

		return NextResponse.json({
			success: true,
			message: `Successfully generated ${assignments.size} assignments for ${year}!`,
		});
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}

function generateAssignments(people: any[], restrictions: Map<number, Set<number>>): Map<number, number> | null {
	const maxAttempts = 1000;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		const receivers = [...people];
		const assignments = new Map<number, number>();
		let valid = true;

		// Shuffle receivers
		for (let i = receivers.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[receivers[i], receivers[j]] = [receivers[j], receivers[i]];
		}

		for (let i = 0; i < people.length; i++) {
			const giver = people[i];
			const receiver = receivers[i];

			// Check if giver gets themselves
			if (giver.id === receiver.id) {
				valid = false;
				break;
			}

			// Check restrictions
			const restricted = restrictions.get(giver.id);
			if (restricted && restricted.has(receiver.id)) {
				valid = false;
				break;
			}

			assignments.set(giver.id, receiver.id);
		}

		if (valid) {
			return assignments;
		}
	}

	return null;
}
