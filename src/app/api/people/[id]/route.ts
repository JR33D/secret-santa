import { NextRequest } from "next/server";
import { getDb } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const db = await getDb();

    await db.run('DELETE FROM people WHERE id = ?', [id]);

    return Response.json({ success: true }, { status: 200 });
  	} catch (error: unknown) {
  		return Response.json({ error: error instanceof Error ? error.message : 'An unknown error occurred' }, { status: 500 });
  	}
  }
