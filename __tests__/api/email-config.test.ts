import { GET, POST } from '@/app/api/email-config/route';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

// Mock getDb
jest.mock('@/lib/db');

describe('Email API Route', () => {
	let mockDb: any;

	beforeEach(() => {
		mockDb = {
			get: jest.fn(),
			run: jest.fn(),
		};
		(getDb as jest.Mock).mockResolvedValue(mockDb);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('GET', () => {
		it('should return the email config if exists', async () => {
			const fakeRow = {
				smtp_server: 'smtp.example.com',
				smtp_port: 587,
				smtp_username: 'user',
				from_email: 'test@example.com',
			};
			mockDb.get.mockResolvedValue(fakeRow);

			const response = await GET();
			const json = await response.json();

			expect(mockDb.get).toHaveBeenCalledWith('SELECT smtp_server, smtp_port, smtp_username, from_email FROM email_config LIMIT 1');
			expect(json).toEqual(fakeRow);
		});

		it('should return an empty object if no config exists', async () => {
			mockDb.get.mockResolvedValue(undefined);

			const response = await GET();
			const json = await response.json();

			expect(json).toEqual({});
		});
	});

	describe('POST', () => {
		const requestBody = {
			smtp_server: 'smtp.example.com',
			smtp_port: 587,
			smtp_username: 'user',
			smtp_password: 'pass',
			from_email: 'test@example.com',
		};

		it('should update existing config if row exists', async () => {
			mockDb.get.mockResolvedValue({ id: 1 });

			const req = {
				json: jest.fn().mockResolvedValue(requestBody),
			};

			const response = await POST(req as any);
			const json = await response.json();

			expect(mockDb.get).toHaveBeenCalledWith('SELECT id FROM email_config LIMIT 1');
			expect(mockDb.run).toHaveBeenCalledWith('UPDATE email_config SET smtp_server = ?, smtp_port = ?, smtp_username = ?, smtp_password = ?, from_email = ? WHERE id = ?', [
				requestBody.smtp_server,
				requestBody.smtp_port,
				requestBody.smtp_username,
				requestBody.smtp_password,
				requestBody.from_email,
				1,
			]);
			expect(json).toEqual({ success: true });
		});

		it('should insert a new config if none exists', async () => {
			mockDb.get.mockResolvedValue(undefined);
			mockDb.run.mockResolvedValue({ lastID: 1 });

			const req = {
				json: jest.fn().mockResolvedValue(requestBody),
			};

			const response = await POST(req as any);
			const json = await response.json();

			expect(mockDb.get).toHaveBeenCalledWith('SELECT id FROM email_config LIMIT 1');
			expect(mockDb.run).toHaveBeenCalledWith('INSERT INTO email_config (smtp_server, smtp_port, smtp_username, smtp_password, from_email) VALUES (?, ?, ?, ?, ?)', [
				requestBody.smtp_server,
				requestBody.smtp_port,
				requestBody.smtp_username,
				requestBody.smtp_password,
				requestBody.from_email,
			]);
			expect(json).toEqual({ success: true });
		});
	});
});
