import { NextRequest } from "next/server";
import { getDb } from '@/lib/db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ year: string }> }
) {
  try {
    const { year } = await context.params;
    const db = await getDb();

    const parsedYear = parseInt(year);
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get('pool_id');

    if (!poolId) {
      return Response.json({ error: 'Pool ID is required' }, { status: 400 });
    }

    // Get all people in this pool
    const people = await db.all(
      'SELECT * FROM people WHERE pool_id = ? ORDER BY id',
      [parseInt(poolId)]
    );

    if (people.length < 2) {
      return Response.json(
        {
          success: false,
          message: 'Need at least 2 people in the pool to generate assignments'
        },
        { status: 400 }
      );
    }

    // Check if assignments already exist
    const existing = await db.get(
      'SELECT COUNT(*) as count FROM assignments WHERE year = ? AND pool_id = ?',
      [parsedYear, parseInt(poolId)]
    );

    if (existing.count > 0) {
      return Response.json(
        {
          success: false,
          message: `Assignments for ${parsedYear} in this pool already exist. Delete them first to regenerate.`
        },
        { status: 400 }
      );
    }

    // Get restrictions
    const restrictions = await db.all(
      `SELECT r.giver_id, r.receiver_id
       FROM restrictions r
       JOIN people g ON r.giver_id = g.id
       JOIN people rec ON r.receiver_id = rec.id
       WHERE g.pool_id = ? AND rec.pool_id = ?`,
      [parseInt(poolId), parseInt(poolId)]
    );

    const restrictionMap = new Map<number, Set<number>>();
    type RestrictionResult = { giver_id: number; receiver_id: number };
    restrictions.forEach((r: RestrictionResult) => {
      if (!restrictionMap.has(r.giver_id)) {
        restrictionMap.set(r.giver_id, new Set());
      }
      restrictionMap.get(r.giver_id)!.add(r.receiver_id);
    });

    // Generate assignments
    const assignments = generateAssignments(people, restrictionMap);

    if (!assignments) {
      return Response.json(
        {
          success: false,
          message:
            'Could not generate valid assignments with current restrictions. Adjust restrictions and try again.'
        },
        { status: 400 }
      );
    }

    // Save all assignments
    for (const [giverId, receiverId] of assignments) {
      await db.run(
        `INSERT INTO assignments (year, giver_id, receiver_id, pool_id)
         VALUES (?, ?, ?, ?)`,
        [parsedYear, giverId, receiverId, parseInt(poolId)]
      );
    }

    return Response.json(
      {
        success: true,
        message: `Successfully generated ${assignments.size} assignments for ${parsedYear}!`
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return Response.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
  }
}

function generateAssignments(
  people: { id: number }[],
  restrictions: Map<number, Set<number>>
): Map<number, number> | null {
  const maxAttempts = 1000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const receivers: { id: number }[] = [...people];
    const assignments = new Map<number, number>();
    let valid = true;

    // Shuffle
    for (let i = receivers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
    }

    for (let i = 0; i < people.length; i++) {
      const giver = people[i];
      const receiver = receivers[i];

      if (giver.id === receiver.id) {
        valid = false;
        break;
      }

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
 