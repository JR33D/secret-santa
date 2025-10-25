import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { compare } from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { status: 401, json: async () => ({ error: "Unauthorized" }) } as any;
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return { status: 400, json: async () => ({ error: "Current and new password are required" }) } as any;
    }

    if (newPassword.length < 8) {
      return { status: 400, json: async () => ({ error: "New password must be at least 8 characters" }) } as any;
    }

    const db = await getDb();
    const userId = (session.user as any).id;

    // Get current password hash
    const user = await db.get(
      "SELECT password_hash FROM users WHERE id = ?",
      [userId]
    );

    if (!user) {
      return { status: 404, json: async () => ({ error: "User not found" }) } as any;
    }

    // Verify current password
    const isValid = await compare(currentPassword, user.password_hash);
    if (!isValid) {
      return { status: 400, json: async () => ({ error: "Current password is incorrect" }) } as any;
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(newPassword);
    await db.run(
      "UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?",
      [newPasswordHash, userId]
    );

    return { status: 200, json: async () => ({ message: "Password changed successfully" }) } as any;
  } catch (error: any) {
    return { status: 500, json: async () => ({ error: error.message }) } as any;
  }
}