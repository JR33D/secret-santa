import { GET, POST } from '@/app/api/users/route';
import { DELETE } from '@/app/api/users/[id]/route';
import { POST as ResendCredentials } from '@/app/api/users/[id]/resend-credentials/route';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import nodemailer from 'nodemailer';

jest.mock('@/lib/db');
jest.mock('next-auth');
jest.mock('nodemailer');
jest.mock('@/lib/email-templates', () => ({
	getEmailHtml: jest.fn(() => '<html>Test Email</html>'),
	getEmailSubject: jest.fn(() => 'Test Subject'),
}));

describe('Users API Routes', () => {
	let mockDb: any;
	let mockTransporter: any;

	beforeEach(() => {
		mockDb = {
			all: jest.fn(),
			get: jest.fn(),
			run: jest.fn(),
			exec: jest.fn(),
		};
		(getDb as jest.Mock).mockResolvedValue(mockDb);

		mockTransporter = {
			sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
		};
		(nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

		(getServerSession as jest.Mock).mockResolvedValue({
			user: { id: '1', role: 'admin' },
		});
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('GET /api/users', () => {
		const mockUsers = [
			{
				id: 1,
				username: 'admin',
				role: 'admin',
				person_id: null,
				must_change_password: 0,
				created_at: '2024-01-01',
			},
			{
				id: 2,
				username: 'johndoe',
				role: 'user',
				person_id: 5,
				person_name: 'John Doe',
				person_email: 'john@example.com',
				must_change_password: 1,
				created_at: '2024-01-15',
			},
		];

		it('returns all users when admin', async () => {
			mockDb.all.mockResolvedValue(mockUsers);

			const response = await GET();
			const json = await response.json();

			expect(mockDb.all).toHaveBeenCalled();
			expect(json).toEqual(mockUsers);
			expect(json).toHaveLength(2);
		});

		it('returns 403 when not admin', async () => {
			(getServerSession as jest.Mock).mockResolvedValue({
				user: { id: '2', role: 'user' },
			});

			const response = await GET();
			const json = await response.json();

			expect(response.status).toBe(403);
			expect(json).toEqual({ error: 'Unauthorized' });
		});

		it('returns 403 when not authenticated', async () => {
			(getServerSession as jest.Mock).mockResolvedValue(null);

			const response = await GET();
			const json = await response.json();

			expect(response.status).toBe(403);
			expect(json).toEqual({ error: 'Unauthorized' });
		});

		it('handles database errors', async () => {
			mockDb.all.mockRejectedValue(new Error('DB Error'));

			const response = await GET();
			const json = await response.json();

			expect(response.status).toBe(500);
			expect(json).toEqual({ error: 'DB Error' });
		});
	});

	describe('POST /api/users', () => {
		const mockPerson = {
			id: 5,
			name: 'John Doe',
			email: 'john@example.com',
		};

		const mockEmailConfig = {
			smtp_server: 'smtp.example.com',
			smtp_port: 587,
			smtp_username: 'user@example.com',
			smtp_password: 'password',
			from_email: 'noreply@example.com',
		};

		it('creates user and sends email successfully', async () => {
			mockDb.get
				.mockResolvedValueOnce(mockPerson) // Get person
				.mockResolvedValueOnce(null) // Check existing user
				.mockResolvedValueOnce(null); // Check username availability
			mockDb.run.mockResolvedValue({ lastID: 10 });

			// Provide env SMTP config
			process.env.SMTP_SERVER = mockEmailConfig.smtp_server;
			process.env.SMTP_PORT = String(mockEmailConfig.smtp_port);
			process.env.SMTP_USERNAME = mockEmailConfig.smtp_username;
			process.env.SMTP_PASSWORD = mockEmailConfig.smtp_password;
			process.env.FROM_EMAIL = mockEmailConfig.from_email;

			const req = {
				json: jest.fn().mockResolvedValue({ person_id: 5 }),
			};

			const response = await POST(req as any);
			const json = await response.json();

			expect(json).toMatchObject({
				id: 10,
				username: 'johndoe',
				person_name: 'John Doe',
				person_email: 'john@example.com',
				emailSent: true,
			});
			expect(json.tempPassword).toBeDefined();
			expect(mockTransporter.sendMail).toHaveBeenCalled();
		});

		it('generates unique username when conflict exists', async () => {
			mockDb.get
				.mockResolvedValueOnce(mockPerson)
				.mockResolvedValueOnce(null)
				.mockResolvedValueOnce({ id: 1 }) // Username exists
				.mockResolvedValueOnce(null) // Username with number available
				.mockResolvedValueOnce(mockEmailConfig);
			mockDb.run.mockResolvedValue({ lastID: 10 });

			const req = {
				json: jest.fn().mockResolvedValue({ person_id: 5 }),
			};

			const response = await POST(req as any);
			const json = await response.json();

			expect(json.username).toBe('johndoe1');
		});

		it('returns 400 when person_id missing', async () => {
			const req = {
				json: jest.fn().mockResolvedValue({}),
			};

			const response = await POST(req as any);
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'Person ID is required' });
		});

		it('returns 404 when person not found', async () => {
			mockDb.get.mockResolvedValue(null);

			const req = {
				json: jest.fn().mockResolvedValue({ person_id: 999 }),
			};

			const response = await POST(req as any);
			const json = await response.json();

			expect(response.status).toBe(404);
			expect(json).toEqual({ error: 'Person not found' });
		});

		it('returns 400 when user already exists for person', async () => {
			mockDb.get.mockResolvedValueOnce(mockPerson).mockResolvedValueOnce({ id: 5 }); // User exists

			const req = {
				json: jest.fn().mockResolvedValue({ person_id: 5 }),
			};

			const response = await POST(req as any);
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'User already exists for this person' });
		});

		it('creates user even when email fails', async () => {
			mockDb.get.mockResolvedValueOnce(mockPerson).mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(null); // No email config
			mockDb.run.mockResolvedValue({ lastID: 10 });

			const req = {
				json: jest.fn().mockResolvedValue({ person_id: 5 }),
			};

			// Ensure no SMTP env vars are present for this test
			delete process.env.SMTP_SERVER;
			delete process.env.SMTP_PORT;
			delete process.env.SMTP_USERNAME;
			delete process.env.SMTP_PASSWORD;
			delete process.env.FROM_EMAIL;

			const response = await POST(req as any);
			const json = await response.json();

			expect(json.emailSent).toBe(false);
			expect(json.emailError).toBe('Email not configured (set SMTP_SERVER and FROM_EMAIL in env)');
			expect(json.id).toBe(10);
		});

		it('returns 403 when not admin', async () => {
			(getServerSession as jest.Mock).mockResolvedValue({
				user: { id: '2', role: 'user' },
			});

			const req = {
				json: jest.fn().mockResolvedValue({ person_id: 5 }),
			};

			const response = await POST(req as any);
			const json = await response.json();

			expect(response.status).toBe(403);
			expect(json).toEqual({ error: 'Unauthorized' });
		});
	});

	describe('DELETE /api/users/[id]', () => {
		it('deletes user successfully', async () => {
			mockDb.get
				.mockResolvedValueOnce({ role: 'user' }) // User to delete
				.mockResolvedValueOnce({ count: 2 }); // Admin count
			mockDb.run.mockResolvedValue({ changes: 1 });

			const req = {} as any;
			const response = await DELETE(req, { params: { id: '5' } });
			const json = await response.json();

			expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', [5]);
			expect(json).toEqual({ message: 'User deleted successfully' });
		});

		it('prevents deleting own account', async () => {
			const req = {} as any;
			const response = await DELETE(req, { params: { id: '1' } });
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'Cannot delete your own account' });
		});

		it('prevents deleting last admin', async () => {
			mockDb.get.mockResolvedValueOnce({ role: 'admin' }).mockResolvedValueOnce({ count: 1 });

			const req = {} as any;
			const response = await DELETE(req, { params: { id: '2' } });
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'Cannot delete the last admin user' });
		});

		it('returns 404 when user not found', async () => {
			mockDb.get.mockResolvedValue(null);

			const req = {} as any;
			const response = await DELETE(req, { params: { id: '999' } });
			const json = await response.json();

			expect(response.status).toBe(404);
			expect(json).toEqual({ error: 'User not found' });
		});

		it('returns 403 when not admin', async () => {
			(getServerSession as jest.Mock).mockResolvedValue({
				user: { id: '2', role: 'user' },
			});

			const req = {} as any;
			const response = await DELETE(req, { params: { id: '5' } });
			const json = await response.json();

			expect(response.status).toBe(403);
			expect(json).toEqual({ error: 'Unauthorized' });
		});
	});

		describe('POST /api/users/[id]/resend-credentials', () => {
		const mockUser = {
			id: 5,
			username: 'johndoe',
			person_name: 'John Doe',
			person_email: 'john@example.com',
		};

		const mockEmailConfig = {
			smtp_server: 'smtp.example.com',
			smtp_port: 587,
			smtp_username: 'user@example.com',
			smtp_password: 'password',
			from_email: 'noreply@example.com',
		};

			it('generates new password and sends email', async () => {
				mockDb.get.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null);
				mockDb.run.mockResolvedValue({ changes: 1 });

				// Provide env SMTP config
				process.env.SMTP_SERVER = mockEmailConfig.smtp_server;
				process.env.SMTP_PORT = String(mockEmailConfig.smtp_port);
				process.env.SMTP_USERNAME = mockEmailConfig.smtp_username;
				process.env.SMTP_PASSWORD = mockEmailConfig.smtp_password;
				process.env.FROM_EMAIL = mockEmailConfig.from_email;

				const req = {} as any;
				const response = await ResendCredentials(req, { params: { id: '5' } });
				const json = await response.json();

				expect(mockDb.run).toHaveBeenCalledWith('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?', [expect.any(String), 5]);
				expect(json).toMatchObject({
					username: 'johndoe',
					person_name: 'John Doe',
					person_email: 'john@example.com',
					emailSent: true,
				});
				expect(json.tempPassword).toBeDefined();
			});

		it('returns 404 when user not found', async () => {
			mockDb.get.mockResolvedValue(null);

			const req = {} as any;
			const response = await ResendCredentials(req, { params: { id: '999' } });
			const json = await response.json();

			expect(response.status).toBe(404);
			expect(json).toEqual({ error: 'User not found' });
		});

		it('returns 400 when user has no email', async () => {
			mockDb.get.mockResolvedValue({
				...mockUser,
				person_email: null,
			});

			const req = {} as any;
			const response = await ResendCredentials(req, { params: { id: '5' } });
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'User has no email address associated' });
		});

			it('returns 400 when email not configured', async () => {
				mockDb.get.mockResolvedValueOnce(mockUser).mockResolvedValueOnce(null);

				const req = {} as any;

				// Ensure no SMTP env vars are present for this test
				delete process.env.SMTP_SERVER;
				delete process.env.SMTP_PORT;
				delete process.env.SMTP_USERNAME;
				delete process.env.SMTP_PASSWORD;
				delete process.env.FROM_EMAIL;

				const response = await ResendCredentials(req, { params: { id: '5' } });
				const json = await response.json();

				expect(response.status).toBe(400);
				expect(json).toEqual({ error: 'Email not configured. Set SMTP_SERVER and FROM_EMAIL in env' });
			});

		it('returns 403 when not admin', async () => {
			(getServerSession as jest.Mock).mockResolvedValue({
				user: { id: '2', role: 'user' },
			});

			const req = {} as any;
			const response = await ResendCredentials(req, { params: { id: '5' } });
			const json = await response.json();

			expect(response.status).toBe(403);
			expect(json).toEqual({ error: 'Unauthorized' });
		});
	});
});
