import { POST } from '@/app/api/send-notifications/[year]/route';
import { getDb } from '@/lib/db';
import nodemailer from 'nodemailer';

jest.mock('@/lib/db');
jest.mock('nodemailer');

describe('Send Notifications API Route', () => {
	let mockDb: any;
	let mockTransporter: any;

	beforeEach(() => {
		mockDb = {
			get: jest.fn(),
			all: jest.fn(),
		};
		(getDb as jest.Mock).mockResolvedValue(mockDb);

		mockTransporter = {
			sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
		};
		(nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('POST /api/send-notifications/[year]', () => {
		const mockConfig = {
			smtp_server: 'smtp.example.com',
			smtp_port: 587,
			smtp_username: 'user@example.com',
			smtp_password: 'password123',
			from_email: 'noreply@example.com',
		};

		const mockAssignments = [
			{
				giver_id: 1,
				giver_name: 'Alice',
				giver_email: 'alice@example.com',
				receiver_id: 2,
				receiver_name: 'Bob',
			},
			{
				giver_id: 2,
				giver_name: 'Bob',
				giver_email: 'bob@example.com',
				receiver_id: 3,
				receiver_name: 'Charlie',
			},
		];

		it('returns error when email not configured', async () => {
			mockDb.get.mockResolvedValue(null);

			const req = {} as any;
			const response = await POST(req, { params: { year: '2024' } });
			const json = await response.json();

			expect(json).toEqual([{ success: false, message: 'Email not configured' }]);
		});

		it('sends emails to all givers successfully', async () => {
			mockDb.get.mockResolvedValueOnce(mockConfig);
			mockDb.all.mockResolvedValueOnce(mockAssignments);
			mockDb.all.mockResolvedValue([]); // No wishlist items

			const req = {} as any;
			const response = await POST(req, { params: { year: '2024' } });
			const json = await response.json();

			expect(nodemailer.createTransport).toHaveBeenCalledWith({
				host: 'smtp.example.com',
				port: 587,
				secure: false,
				auth: {
					user: 'user@example.com',
					pass: 'password123',
				},
			});

			expect(mockTransporter.sendMail).toHaveBeenCalledTimes(2);
			expect(json).toHaveLength(2);
			expect(json[0]).toMatchObject({
				giver: 'Alice',
				success: true,
				message: 'Email sent',
			});
			expect(json[1]).toMatchObject({
				giver: 'Bob',
				success: true,
				message: 'Email sent',
			});
		});

		it('includes wishlist items in email when available', async () => {
			const wishlistItems = [
				{ item_name: 'Book', link: 'https://example.com/book', image_url: null },
				{ item_name: 'Gadget', link: null, image_url: 'https://example.com/gadget.jpg' },
			];

			mockDb.get.mockResolvedValueOnce(mockConfig);
			mockDb.all.mockResolvedValueOnce([mockAssignments[0]]).mockResolvedValueOnce(wishlistItems); // Wishlist for receiver

			const req = {} as any;
			await POST(req, { params: { year: '2024' } });

			const emailCall = mockTransporter.sendMail.mock.calls[0][0];
			expect(emailCall.html).toContain('Their Wishlist:');
			expect(emailCall.html).toContain('Book');
			expect(emailCall.html).toContain('Gadget');
			expect(emailCall.html).toContain('https://example.com/book');
		});

		it('sends email without wishlist section when empty', async () => {
			mockDb.get.mockResolvedValueOnce(mockConfig);
			mockDb.all.mockResolvedValueOnce([mockAssignments[0]]).mockResolvedValueOnce([]); // No wishlist items

			const req = {} as any;
			await POST(req, { params: { year: '2024' } });

			const emailCall = mockTransporter.sendMail.mock.calls[0][0];
			expect(emailCall.html).not.toContain('Their Wishlist:');
		});

		it('handles email send failures gracefully', async () => {
			mockDb.get.mockResolvedValueOnce(mockConfig);
			mockDb.all.mockResolvedValueOnce([mockAssignments[0]]).mockResolvedValue([]);

			mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));

			const req = {} as any;
			const response = await POST(req, { params: { year: '2024' } });
			const json = await response.json();

			expect(json).toHaveLength(1);
			expect(json[0]).toMatchObject({
				giver: 'Alice',
				success: false,
				message: 'SMTP Error',
			});
		});

		it('continues sending emails after individual failures', async () => {
			mockDb.get.mockResolvedValueOnce(mockConfig);
			mockDb.all.mockResolvedValueOnce(mockAssignments).mockResolvedValue([]);

			mockTransporter.sendMail.mockRejectedValueOnce(new Error('Failed for Alice')).mockResolvedValueOnce({ messageId: 'success' });

			const req = {} as any;
			const response = await POST(req, { params: { year: '2024' } });
			const json = await response.json();

			expect(json).toHaveLength(2);
			expect(json[0].success).toBe(false);
			expect(json[1].success).toBe(true);
		});

		it('formats email correctly', async () => {
			mockDb.get.mockResolvedValueOnce(mockConfig);
			mockDb.all.mockResolvedValueOnce([mockAssignments[0]]).mockResolvedValue([]);

			const req = {} as any;
			await POST(req, { params: { year: '2024' } });

			const emailCall = mockTransporter.sendMail.mock.calls[0][0];
			expect(emailCall.from).toBe('noreply@example.com');
			expect(emailCall.to).toBe('alice@example.com');
			expect(emailCall.subject).toContain('Secret Santa 2024');
			expect(emailCall.subject).toContain('Alice');
			expect(emailCall.html).toContain('Alice');
			expect(emailCall.html).toContain('Bob');
		});

		it('queries assignments for specific year', async () => {
			mockDb.get.mockResolvedValueOnce(mockConfig);
			mockDb.all.mockResolvedValue([]);

			const req = {} as any;
			await POST(req, { params: { year: '2025' } });

			expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('WHERE a.year = ?'), [2025]);
		});
	});
});
