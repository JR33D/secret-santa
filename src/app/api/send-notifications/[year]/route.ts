import { getDb } from '@/lib/db';
import nodemailer from 'nodemailer';
import { getEmailHtml, getEmailSubject } from '@/lib/email-templates';

export async function POST(req: Request, { params }: { params: { year: string } }) {
	const year = parseInt(params.year);
	const db = await getDb();

	const config = await db.get('SELECT * FROM email_config LIMIT 1');
	if (!config) return Response.json([{ success: false, message: 'Email not configured' }], { status: 200 });

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
			wishlistHtml = `
				<div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<h3 style="margin-top: 0; color: #92400e; font-size: 18px;">🎁 Their Wishlist:</h3>
					<ul style="color: #78350f; line-height: 1.8; padding-left: 20px;">
			`;
			
			for (const item of wishlist) {
				wishlistHtml += `<li style="margin-bottom: 15px;"><strong>${item.item_name}</strong>`;
				if (item.link) {
					wishlistHtml += `<br><a href="${item.link}" style="color: #4f46e5; text-decoration: none;">🔗 View Link</a>`;
				}
				if (item.image_url) {
					wishlistHtml += `<br><img src="${item.image_url}" style="max-width: 200px; margin-top: 10px; border-radius: 4px; border: 1px solid #e5e7eb;" alt="${item.item_name}">`;
				}
				wishlistHtml += '</li>';
			}
			wishlistHtml += '</ul></div>';
		} else {
			wishlistHtml = `
				<div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
					<p style="margin: 0; color: #6b7280; font-style: italic;">
						${assignment.receiver_name} hasn't added any items to their wishlist yet. 
						Consider surprising them with something thoughtful! 🎁
					</p>
				</div>
			`;
		}

		try {
			const emailHtml = getEmailHtml('assignment-notification', {
				year: String(year),
				giver_name: assignment.giver_name,
				receiver_name: assignment.receiver_name,
				wishlist_section: wishlistHtml
			});

			const subject = getEmailSubject('assignment-notification', {
				year: String(year),
				giver_name: assignment.giver_name
			});

			await transporter.sendMail({
				from: config.from_email,
				to: assignment.giver_email,
				subject: subject,
				html: emailHtml,
			});
			
			results.push({ giver: assignment.giver_name, success: true, message: 'Email sent' });
		} catch (error: any) {
			results.push({ giver: assignment.giver_name, success: false, message: String(error.message || error) });
		}
	}

	return Response.json(results, { status: 200 });
}