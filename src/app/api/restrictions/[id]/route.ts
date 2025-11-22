import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const db = await getDb();

  await db.run("DELETE FROM restrictions WHERE id = ?", [id]);

  return NextResponse.json({ success: true }, { status: 200 });
}
