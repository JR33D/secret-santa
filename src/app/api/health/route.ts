import { getDb } from "@/lib/db";

export async function GET() {
  try {
    // Check database connectivity
    const db = await getDb();
    await db.get("SELECT 1");

    return Response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    }, { status: 200 });
  } catch (error: any) {
    // debug - ensure the fallback path returns what we expect
    const resp = Response.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
      error: error.message,
    }, { status: 503 });
    // eslint-disable-next-line no-console
    console.log('DEBUG: health catch returned ->', resp);
    return resp;
  }
}