import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import nodemailer from 'nodemailer';

export async function POST(req: Request, { params }: { params: { year: string } }) {
	const year = parseInt(params.year);
	const db = await getDb();

	const config = await db.get('SELECT * FROM email_config LIMIT 1');
	if (!config) return NextResponse.json([{ success: false, message: 'Email not configured' }]);

	const transporter = nodemailer.createTransport({
		host: config.smtp_server,
		port: config.smtp_port,
		secure: false,
		auth: { user: config.smtp_username, pass: config.smtp_password },
	});

	const assignments = await db.all(
		`
    SELECT a.*, g.name as giver_name, g.email as giver_email,
           r.name as receiver_name, r.id as receiver_id
    FROM assignments a
    JOIN people g ON a.giver_id = g.id
    JOIN people r ON a.receiver_id = r.id
    WHERE a.year = ?
  `,
		[year],
	);

	const results: any[] = [];
	for (const assignment of assignments) {
		const wishlist = await db.all('SELECT * FROM wishlist_items WHERE person_id = ?', [assignment.receiver_id]);
		let wishlistHtml = '';
		if (wishlist.length > 0) {
			wishlistHtml = '<h3>Their Wishlist:</h3><ul>';
			for (const item of wishlist) {
				wishlistHtml += `<li><strong>${item.item_name}</strong>`;
				if (item.link) wishlistHtml += ` - <a href="${item.link}">Link</a>`;
				if (item.image_url) wishlistHtml += `<br><img src="${item.image_url}" style="max-width:200px; margin-top:5px;">`;
				wishlistHtml += '</li>';
			}
			wishlistHtml += '</ul>';
		}
		const html = `
      <div style="font-family: Arial, sans-serif;">
      <h2>🎅 Secret Santa ${year}</h2>
      <p><strong>This email is for: ${assignment.giver_name}</strong></p>
      <p>Hi ${assignment.giver_name}!</p>
      <p>You are the Secret Santa for: <strong>${assignment.receiver_name}</strong></p>
      ${wishlistHtml}
      <p>Happy gifting! 🎁</p>
      </div>
    `;
		try {
			await transporter.sendMail({
				from: config.from_email,
				to: assignment.giver_email,
				subject: `Secret Santa ${year} - Assignment for ${assignment.giver_name}`,
				html,
			});
			results.push({ giver: assignment.giver_name, success: true, message: 'Email sent' });
		} catch (error: any) {
			results.push({ giver: assignment.giver_name, success: false, message: String(error.message || error) });
		}
	}

	return NextResponse.json(results);
}
