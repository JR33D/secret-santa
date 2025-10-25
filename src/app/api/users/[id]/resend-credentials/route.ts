import { getDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hashPassword, generatePassword } from "@/lib/auth";
import nodemailer from "nodemailer";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    const db = await getDb();
    const userId = parseInt(params.id);

    // Get user and person details
    const user = await db.get(
      `SELECT u.*, p.name as person_name, p.email as person_email
       FROM users u
       LEFT JOIN people p ON u.person_id = p.id
       WHERE u.id = ?`,
      [userId]
    );

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.person_email) {
      return Response.json({ error: "User has no email address associated" }, { status: 400 });
    }

    // Generate new temporary password
    const tempPassword = generatePassword();
    const passwordHash = await hashPassword(tempPassword);

    // Update user with new password
    await db.run(
      "UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?",
      [passwordHash, userId]
    );

    // Try to send email
    let emailSent = false;
    let emailError = "";

    try {
      const { getEmailHtml, getEmailSubject } = await import('@/lib/email-templates');
      const config = await db.get('SELECT * FROM email_config LIMIT 1');
      
      if (!config || !config.smtp_server) {
        return Response.json({ error: "Email not configured. Configure email settings first." }, { status: 400 });
      }

      const transporter = nodemailer.createTransport({
        host: config.smtp_server,
        port: config.smtp_port,
        secure: false,
        auth: { 
          user: config.smtp_username, 
          pass: config.smtp_password 
        },
      });

      const emailHtml = getEmailHtml('password-reset', {
        person_name: user.person_name,
        username: user.username,
        temp_password: tempPassword
      });

      const subject = getEmailSubject('password-reset', {
        person_name: user.person_name
      });

      await transporter.sendMail({
        from: config.from_email,
        to: user.person_email,
        subject: subject,
        html: emailHtml,
      });

      emailSent = true;
    } catch (error: any) {
      emailError = error.message || "Failed to send email";
    }

    return Response.json({
      username: user.username,
      tempPassword,
      person_name: user.person_name,
      person_email: user.person_email,
      emailSent,
      emailError,
      message: emailSent 
        ? "New password generated and emailed successfully" 
        : "New password generated but email failed to send",
    }, { status: 200 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}