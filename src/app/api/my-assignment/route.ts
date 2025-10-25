import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { status: 401, json: async () => ({ error: "Unauthorized" }) } as any;
    }

    const { searchParams } = new URL(request.url);
    const personId = searchParams.get("person_id");
    const year = searchParams.get("year");

    if (!personId || !year) {
      return { status: 400, json: async () => ({ error: "person_id and year are required" }) } as any;
    }

    // Verify the user is requesting their own assignment
    const userPersonId = (session.user as any).personId;
    if (String(userPersonId) !== personId && (session.user as any).role !== "admin") {
      return { status: 403, json: async () => ({ error: "You can only view your own assignment" }) } as any;
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
      [parseInt(personId), parseInt(year)]
    );

    return { status: 200, json: async () => assignments } as any;
  } catch (error: any) {
    return { status: 500, json: async () => ({ error: error.message }) } as any;
  }
}