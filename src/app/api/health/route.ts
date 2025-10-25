import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    // Check database connectivity
    const db = await getDb();
    await db.get("SELECT 1");

    return { status: 200, json: async () => ({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    }) } as any;
  } catch (error: any) {
    return { status: 503, json: async () => ({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        error: error.message,
      }) } as any;
  }
}