import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, generatePassword } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = await getDb();
    const users = await db.all(`
      SELECT 
        u.id,
        u.username,
        u.role,
        u.person_id,
        u.must_change_password,
        u.created_at,
        p.name as person_name,
        p.email as person_email
      FROM users u
      LEFT JOIN people p ON u.person_id = p.id
      ORDER BY u.role DESC, u.username
    `);

    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { person_id } = await request.json();

    if (!person_id) {
      return NextResponse.json(
        { error: "Person ID is required" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Get person details
    const person = await db.get("SELECT * FROM people WHERE id = ?", [
      person_id,
    ]);

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Check if user already exists for this person
    const existingUser = await db.get(
      "SELECT id FROM users WHERE person_id = ?",
      [person_id]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists for this person" },
        { status: 400 }
      );
    }

    // Generate username from person's name (lowercase, no spaces)
    const baseUsername = person.name.toLowerCase().replace(/\s+/g, "");
    
    // Check if username exists, add number if needed
    let username = baseUsername;
    let counter = 1;
    while (await db.get("SELECT id FROM users WHERE username = ?", [username])) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Generate temporary password
    const tempPassword = generatePassword();
    const passwordHash = await hashPassword(tempPassword);

    // Create user
    const result = await db.run(
      `INSERT INTO users (username, password_hash, role, person_id, must_change_password) 
       VALUES (?, ?, 'user', ?, 1)`,
      [username, passwordHash, person_id]
    );

    return NextResponse.json({
      id: result.lastID,
      username,
      tempPassword, // Send this back so admin can share it
      person_name: person.name,
      person_email: person.email,
      message: "User created successfully",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}