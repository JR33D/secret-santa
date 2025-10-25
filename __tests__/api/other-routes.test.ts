import { GET as getHealth } from '@/app/api/health/route';
import { GET as getMyAssignment } from '@/app/api/my-assignment/route';
import { POST as changePassword } from '@/app/api/change-password/route';
import { getDb } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { compare } from 'bcryptjs';

jest.mock('@/lib/db');
jest.mock('next-auth');
jest.mock('bcryptjs');

describe('Other API Routes', () => {
	let mockDb: any;

	beforeEach(() => {
		mockDb = {
			all: jest.fn(),
			get: jest.fn(),
			run: jest.fn(),
		};
		(getDb as jest.Mock).mockResolvedValue(mockDb);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('GET /api/health', () => {
		it('returns healthy status when database connected', async () => {
			mockDb.get.mockResolvedValue({ result: 1 });

			const response = await getHealth();
			const json = await response.json();

			expect(json.status).toBe('healthy');
			expect(json.database).toBe('connected');
			expect(json.timestamp).toBeDefined();
			expect(mockDb.get).toHaveBeenCalledWith('SELECT 1');
		});

		it('returns unhealthy status when database fails', async () => {
			mockDb.get.mockRejectedValue(new Error('Connection failed'));

			const response = await getHealth();
			const json = await response.json();

			expect(response.status).toBe(503);
			expect(json.status).toBe('unhealthy');
			expect(json.database).toBe('disconnected');
			expect(json.error).toBe('Connection failed');
		});

		it('returns unhealthy when getDb fails', async () => {
			(getDb as jest.Mock).mockRejectedValue(new Error('DB init failed'));

			const response = await getHealth();
			const json = await response.json();

			expect(response.status).toBe(503);
			expect(json.status).toBe('unhealthy');
		});
	});

	describe('GET /api/my-assignment', () => {
		const mockSession = {
			user: { id: '5', role: 'user', personId: 10 },
		};

		const mockAssignments = [
			{
				year: 2024,
				receiver_id: 15,
				receiver_name: 'Bob',
				receiver_email: 'bob@example.com',
			},
		];

		beforeEach(() => {
			(getServerSession as jest.Mock).mockResolvedValue(mockSession);
		});

		it('returns assignments for authenticated user', async () => {
			mockDb.all.mockResolvedValue(mockAssignments);

			const req = { url: 'http://localhost/api/my-assignment?person_id=10&year=2024' };
			const response = await getMyAssignment(req as any);
			const json = await response.json();

			expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('WHERE a.giver_id = ? AND a.year = ?'), [10, 2024]);
			expect(json).toEqual(mockAssignments);
		});

		it('allows admin to view any assignment', async () => {
			(getServerSession as jest.Mock).mockResolvedValue({
				user: { id: '1', role: 'admin', personId: 1 },
			});
			mockDb.all.mockResolvedValue(mockAssignments);

			const req = { url: 'http://localhost/api/my-assignment?person_id=10&year=2024' };
			const response = await getMyAssignment(req as any);
			const json = await response.json();

			expect(json).toEqual(mockAssignments);
		});

		it('returns 401 when not authenticated', async () => {
			(getServerSession as jest.Mock).mockResolvedValue(null);

			const req = { url: 'http://localhost/api/my-assignment?person_id=10&year=2024' };
			const response = await getMyAssignment(req as any);
			const json = await response.json();

			expect(response.status).toBe(401);
			expect(json).toEqual({ error: 'Unauthorized' });
		});

		it('returns 400 when person_id missing', async () => {
			const req = { url: 'http://localhost/api/my-assignment?year=2024' };
			const response = await getMyAssignment(req as any);
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'person_id and year are required' });
		});

		it('returns 400 when year missing', async () => {
			const req = { url: 'http://localhost/api/my-assignment?person_id=10' };
			const response = await getMyAssignment(req as any);
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'person_id and year are required' });
		});

		it('returns 403 when user tries to view another persons assignment', async () => {
			const req = { url: 'http://localhost/api/my-assignment?person_id=99&year=2024' };
			const response = await getMyAssignment(req as any);
			const json = await response.json();

			expect(response.status).toBe(403);
			expect(json).toEqual({ error: 'You can only view your own assignment' });
		});

		it('handles database errors', async () => {
			mockDb.all.mockRejectedValue(new Error('DB Error'));

			const req = { url: 'http://localhost/api/my-assignment?person_id=10&year=2024' };
			const response = await getMyAssignment(req as any);
			const json = await response.json();

			expect(response.status).toBe(500);
			expect(json).toEqual({ error: 'DB Error' });
		});
	});

	describe('POST /api/change-password', () => {
		const mockSession = {
			user: { id: '5', role: 'user' },
		};

		beforeEach(() => {
			(getServerSession as jest.Mock).mockResolvedValue(mockSession);
		});

		it('changes password successfully', async () => {
			mockDb.get.mockResolvedValue({
				password_hash: 'hashed_old_password',
			});
			(compare as jest.Mock).mockResolvedValue(true);
			mockDb.run.mockResolvedValue({ changes: 1 });

			const req = {
				json: jest.fn().mockResolvedValue({
					currentPassword: 'oldpass123',
					newPassword: 'newpass123',
				}),
			};

			const response = await changePassword(req as any);
			const json = await response.json();

			expect(mockDb.get).toHaveBeenCalledWith('SELECT password_hash FROM users WHERE id = ?', ['5']);
			expect(compare).toHaveBeenCalledWith('oldpass123', 'hashed_old_password');
			expect(mockDb.run).toHaveBeenCalledWith('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', [expect.any(String), '5']);
			expect(json).toEqual({ message: 'Password changed successfully' });
		});

		it('returns 401 when not authenticated', async () => {
			(getServerSession as jest.Mock).mockResolvedValue(null);

			const req = {
				json: jest.fn().mockResolvedValue({
					currentPassword: 'old',
					newPassword: 'new',
				}),
			};

			const response = await changePassword(req as any);
			const json = await response.json();

			expect(response.status).toBe(401);
			expect(json).toEqual({ error: 'Unauthorized' });
		});

		it('returns 400 when passwords missing', async () => {
			const req = {
				json: jest.fn().mockResolvedValue({}),
			};

			const response = await changePassword(req as any);
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'Current and new password are required' });
		});

		it('returns 400 when new password too short', async () => {
			const req = {
				json: jest.fn().mockResolvedValue({
					currentPassword: 'oldpass',
					newPassword: 'short',
				}),
			};

			const response = await changePassword(req as any);
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'New password must be at least 8 characters' });
		});

		it('returns 400 when current password incorrect', async () => {
			mockDb.get.mockResolvedValue({
				password_hash: 'hashed_old_password',
			});
			(compare as jest.Mock).mockResolvedValue(false);

			const req = {
				json: jest.fn().mockResolvedValue({
					currentPassword: 'wrongpass',
					newPassword: 'newpass123',
				}),
			};

			const response = await changePassword(req as any);
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'Current password is incorrect' });
		});

		it('returns 404 when user not found', async () => {
			mockDb.get.mockResolvedValue(null);

			const req = {
				json: jest.fn().mockResolvedValue({
					currentPassword: 'oldpass',
					newPassword: 'newpass123',
				}),
			};

			const response = await changePassword(req as any);
			const json = await response.json();

			expect(response.status).toBe(404);
			expect(json).toEqual({ error: 'User not found' });
		});

		it('handles database errors', async () => {
			mockDb.get.mockRejectedValue(new Error('DB Error'));

			const req = {
				json: jest.fn().mockResolvedValue({
					currentPassword: 'oldpass',
					newPassword: 'newpass123',
				}),
			};

			const response = await changePassword(req as any);
			const json = await response.json();

			expect(response.status).toBe(500);
			expect(json).toEqual({ error: 'DB Error' });
		});
	});
});
