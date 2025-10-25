import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return { status: 403, json: async () => ({ error: "Unauthorized" }) } as any;
    }

    const db = await getDb();
    const userId = parseInt(params.id);

    // Prevent deleting own account
    if ((session.user as any).id === String(userId)) {
      return { status: 400, json: async () => ({ error: "Cannot delete your own account" }) } as any;
    }

    // Check if user exists
    const user = await db.get("SELECT role FROM users WHERE id = ?", [userId]);
    
    if (!user) {
      return { status: 404, json: async () => ({ error: "User not found" }) } as any;
    }

    // Prevent deleting the last admin
    if (user.role === "admin") {
      const adminCount = await db.get(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin'"
      );
      if (adminCount.count <= 1) {
        return { status: 400, json: async () => ({ error: "Cannot delete the last admin user" }) } as any;
      }
    }

    await db.run("DELETE FROM users WHERE id = ?", [userId]);

    return { status: 200, json: async () => ({ message: "User deleted successfully" }) } as any;
  } catch (error: any) {
    return { status: 500, json: async () => ({ error: error.message }) } as any;
  }
}