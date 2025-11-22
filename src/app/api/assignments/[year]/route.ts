import { NextRequest } from "next/server";
import { getDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ year: string }> }
) {
  try {
    const { year } = await context.params;
    const db = await getDb();

    const parsedYear = parseInt(year);
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

    const queryParams: (string | number)[] = [parsedYear];

    if (poolId) {
      query += ' AND a.pool_id = ?';
      queryParams.push(parseInt(poolId));
    }

    query += ' ORDER BY g.name';

    const assignments = await db.all(query, queryParams);
    return Response.json(assignments, { status: 200 });
  } catch (error: unknown) {
    return Response.json({ error: error instanceof Error ? error.message : "An unknown error occurred" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ year: string }> }
) {
  try {
    const { year } = await context.params;
    const db = await getDb();

    const parsedYear = parseInt(year);
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get('pool_id');

    if (poolId) {
      await db.run(
        'DELETE FROM assignments WHERE year = ? AND pool_id = ?',
        [parsedYear, parseInt(poolId)]
      );
    } else {
      await db.run('DELETE FROM assignments WHERE year = ?', [parsedYear]);
    }

    return Response.json({ message: 'Assignments deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    return Response.json({ error: error instanceof Error ? error.message : "An unknown error occurred" }, { status: 500 });
  }
}
