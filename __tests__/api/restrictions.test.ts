/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/restrictions/route';
import { DELETE } from '@/app/api/restrictions/[id]/route';
import { getDb } from '@/lib/db';

jest.mock('@/lib/db');

interface MockDatabase {
	all: jest.Mock;
	run: jest.Mock;
}

describe('Restrictions API Routes', () => {
	let mockDb: MockDatabase;

	beforeEach(() => {
		mockDb = {
			all: jest.fn(),
			run: jest.fn(),
		};
		(getDb as jest.Mock).mockResolvedValue(mockDb);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('GET /api/restrictions', () => {
		it('returns all restrictions with names', async () => {
			const mockRestrictions = [
				{ id: 1, giver_id: 1, receiver_id: 2, giver_name: 'Alice', receiver_name: 'Bob' },
				{ id: 2, giver_id: 2, receiver_id: 3, giver_name: 'Bob', receiver_name: 'Charlie' },
			];
			mockDb.all.mockResolvedValue(mockRestrictions);

			const response = await GET();
			const json = await response.json();

			expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('JOIN people g ON r.giver_id = g.id'));
			expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('JOIN people rec ON r.receiver_id = rec.id'));
			expect(json).toEqual(mockRestrictions);
			expect(json).toHaveLength(2);
		});

		it('returns empty array when no restrictions', async () => {
			mockDb.all.mockResolvedValue([]);

			const response = await GET();
			const json = await response.json();

			expect(json).toEqual([]);
		});

		it('handles database errors gracefully', async () => {
			mockDb.all.mockRejectedValue(new Error('DB Error'));

			await expect(GET()).rejects.toThrow('DB Error');
		});
	});

	describe('POST /api/restrictions', () => {
		it('creates a new restriction successfully', async () => {
			mockDb.run.mockResolvedValue({ lastID: 5 });

			const req = new Request('http://localhost/api/restrictions', {
				method: 'POST',
				body: JSON.stringify({ giver_id: 1, receiver_id: 2 }),
			});

			const response = await POST(req);
			const json = await response.json();

			expect(mockDb.run).toHaveBeenCalledWith('INSERT INTO restrictions (giver_id, receiver_id) VALUES (?, ?)', [1, 2]);
			expect(json).toEqual({ id: 5, giver_id: 1, receiver_id: 2 });
		});

		it('handles database errors', async () => {
			mockDb.run.mockRejectedValue(new Error('UNIQUE constraint failed'));

			const req = new Request('http://localhost/api/restrictions', {
				method: 'POST',
				body: JSON.stringify({ giver_id: 1, receiver_id: 2 }),
			});

			await expect(POST(req)).rejects.toThrow();
		});

		it('handles duplicate restrictions', async () => {
			mockDb.run.mockRejectedValue(new Error('UNIQUE constraint failed: restrictions.giver_id, restrictions.receiver_id'));

			const req = new Request('http://localhost/api/restrictions', {
				method: 'POST',
				body: JSON.stringify({ giver_id: 1, receiver_id: 2 }),
			});

			await expect(POST(req)).rejects.toThrow('UNIQUE constraint');
		});
	});

	describe('DELETE /api/restrictions/[id]', () => {
		it('deletes a restriction successfully', async () => {
			mockDb.run.mockResolvedValue({ changes: 1 });

			const req = new NextRequest('http://localhost/api/restrictions/5', { method: 'DELETE' });
			const response = await DELETE(req, { params: Promise.resolve({ id: '5' }) });
			const json = await response.json();

			expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM restrictions WHERE id = ?', ['5']);
			expect(json).toEqual({ success: true });
		});

		it('handles deletion of non-existent restriction', async () => {
			mockDb.run.mockResolvedValue({ changes: 0 });

			const req = new NextRequest('http://localhost/api/restrictions/999', { method: 'DELETE' });
			const response = await DELETE(req, { params: Promise.resolve({ id: '999' }) });
			const json = await response.json();

			expect(json).toEqual({ success: true });
		});

		it('handles database errors', async () => {
			mockDb.run.mockRejectedValue(new Error('DB Error'));

			const req = new NextRequest('http://localhost/api/restrictions/5', { method: 'DELETE' });

			await expect(DELETE(req, { params: Promise.resolve({ id: '5' }) })).rejects.toThrow('DB Error');
		});
	});
});
