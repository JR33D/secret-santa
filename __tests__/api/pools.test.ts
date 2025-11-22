/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/pools/route';
import { DELETE, PATCH } from '@/app/api/pools/[id]/route';
import { getDb } from '@/lib/db';

jest.mock('@/lib/db');

interface MockDatabase {
	all: jest.Mock;
	get: jest.Mock;
	run: jest.Mock;
}

interface PostPoolsRequest {
	json: () => Promise<{ name?: string; description?: string }>;
}

type DeleteRequest = object;

interface PatchPoolsRequest {
	json: () => Promise<{ name?: string; description?: string }>;
}

describe('Pools API Routes', () => {
	let mockDb: MockDatabase;

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

	describe('GET /api/pools', () => {
		it('returns all pools with member counts', async () => {
			const mockPools = [
				{ id: 1, name: 'Family', description: 'Family pool', member_count: 5 },
				{ id: 2, name: 'Friends', description: 'Friends pool', member_count: 3 },
			];
			mockDb.all.mockResolvedValue(mockPools);

			const response = await GET();
			const json = await response.json();

			expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('COUNT(people.id) as member_count'));
			expect(json).toEqual(mockPools);
			expect(json).toHaveLength(2);
		});

		it('orders results by name', async () => {
			mockDb.all.mockResolvedValue([]);

			await GET();

			expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('ORDER BY p.name'));
		});

		it('handles database errors', async () => {
			mockDb.all.mockRejectedValue(new Error('DB Error'));

			const response = await GET();
			const json = await response.json();

			expect(response.status).toBe(500);
			expect(json).toEqual({ error: 'DB Error' });
		});
	});

	describe('POST /api/pools', () => {
		it('creates a new pool successfully', async () => {
			mockDb.run.mockResolvedValue({ lastID: 3 });

			const req = {
				json: jest.fn().mockResolvedValue({
					name: 'Work Team',
					description: 'Office gift exchange',
				}),
			};

			const response = await POST(req as PostPoolsRequest);
			const json = await response.json();

			expect(mockDb.run).toHaveBeenCalledWith('INSERT INTO pools (name, description) VALUES (?, ?)', ['Work Team', 'Office gift exchange']);
			expect(json).toMatchObject({
				id: 3,
				name: 'Work Team',
				description: 'Office gift exchange',
				message: 'Pool created successfully',
			});
		});

		it('creates pool with empty description', async () => {
			mockDb.run.mockResolvedValue({ lastID: 4 });

			const req = {
				json: jest.fn().mockResolvedValue({
					name: 'Simple Pool',
					description: '',
				}),
			};

			const response = await POST(req as PostPoolsRequest);
			const json = await response.json();

			expect(mockDb.run).toHaveBeenCalledWith('INSERT INTO pools (name, description) VALUES (?, ?)', ['Simple Pool', '']);
			expect(json.id).toBe(4);
		});

		it('returns 400 when name is missing', async () => {
			const req = {
				json: jest.fn().mockResolvedValue({
					description: 'Test description',
				}),
			};

			const response = await POST(req as PostPoolsRequest);
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'Name is required' });
			expect(mockDb.run).not.toHaveBeenCalled();
		});

		it('returns 400 on duplicate pool name', async () => {
			mockDb.run.mockRejectedValue(new Error('UNIQUE constraint failed'));

			const req = {
				json: jest.fn().mockResolvedValue({
					name: 'Existing Pool',
					description: 'Test',
				}),
			};

			const response = await POST(req as PostPoolsRequest);
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'Pool name already exists' });
		});

		it('handles general database errors', async () => {
			mockDb.run.mockRejectedValue(new Error('DB Error'));

			const req = {
				json: jest.fn().mockResolvedValue({
					name: 'Test Pool',
					description: 'Test',
				}),
			};

			const response = await POST(req as PostPoolsRequest);
			const json = await response.json();

			expect(response.status).toBe(500);
			expect(json).toEqual({ error: 'DB Error' });
		});
	});

	describe('DELETE /api/pools/[id]', () => {
		it('deletes pool when no people assigned', async () => {
			mockDb.get.mockResolvedValue({ count: 0 });
			mockDb.run.mockResolvedValue({ changes: 1 });

			const req = {} as DeleteRequest;
			const response = await DELETE(req, { params: { id: '5' } });
			const json = await response.json();

			expect(mockDb.get).toHaveBeenCalledWith('SELECT COUNT(*) as count FROM people WHERE pool_id = ?', [5]);
			expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM pools WHERE id = ?', [5]);
			expect(json).toEqual({ message: 'Pool deleted successfully' });
		});

		it('returns 400 when pool has people', async () => {
			mockDb.get.mockResolvedValue({ count: 3 });

			const req = {} as DeleteRequest;
			const response = await DELETE(req, { params: { id: '5' } });
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({
				error: 'Cannot delete pool with people in it. Remove or reassign people first.',
			});
			expect(mockDb.run).not.toHaveBeenCalled();
		});

		it('handles database errors', async () => {
			mockDb.get.mockRejectedValue(new Error('DB Error'));

			const req = {} as DeleteRequest;
			const response = await DELETE(req, { params: { id: '5' } });
			// DEBUG: inspect response shape when DB error occurs
			// DEBUG: response inspection removed
			const json = await response.json();

			expect(response.status).toBe(500);
			expect(json).toEqual({ error: 'DB Error' });
		});
	});

	describe('PATCH /api/pools/[id]', () => {
		it('updates pool successfully', async () => {
			mockDb.run.mockResolvedValue({ changes: 1 });

			const req = {
				json: jest.fn().mockResolvedValue({
					name: 'Updated Pool',
					description: 'Updated description',
				}),
			};

			const response = await PATCH(req as PatchPoolsRequest, { params: { id: '5' } });
			const json = await response.json();

			expect(mockDb.run).toHaveBeenCalledWith('UPDATE pools SET name = ?, description = ? WHERE id = ?', ['Updated Pool', 'Updated description', 5]);
			expect(json).toEqual({ message: 'Pool updated successfully' });
		});

		it('handles update errors', async () => {
			mockDb.run.mockRejectedValue(new Error('Update failed'));

			const req = {
				json: jest.fn().mockResolvedValue({
					name: 'Test',
					description: 'Test',
				}),
			};

			const response = await PATCH(req as PatchPoolsRequest, { params: { id: '5' } });
			const json = await response.json();

			expect(response.status).toBe(500);
			expect(json).toEqual({ error: 'Update failed' });
		});
	});
});
