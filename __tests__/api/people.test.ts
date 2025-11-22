/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/people/route';
import { DELETE } from '@/app/api/people/[id]/route';
import { getDb } from '@/lib/db';

jest.mock('@/lib/db');

interface MockDatabase {
	all: jest.Mock;
	get: jest.Mock;
	run: jest.Mock;
}

describe('People API Routes', () => {
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

	describe('GET /api/people', () => {
		const mockPeople = [
			{ id: 1, name: 'John Doe', email: 'john@example.com', pool_id: 1, pool_name: 'Family' },
			{ id: 2, name: 'Jane Smith', email: 'jane@example.com', pool_id: 2, pool_name: 'Friends' },
		];

		it('returns all people when no pool_id provided', async () => {
			mockDb.all.mockResolvedValue(mockPeople);

			const req = new Request('http://localhost/api/people');
			const response = await GET(req);
			const json = await response.json();

			expect(mockDb.all).toHaveBeenCalled();
			expect(json).toEqual(mockPeople);
			expect(json).toHaveLength(2);
		});

		it('filters people by pool_id when provided', async () => {
			const filteredPeople = [mockPeople[0]];
			mockDb.all.mockResolvedValue(filteredPeople);

			const req = new Request('http://localhost/api/people?pool_id=1');
			const response = await GET(req);
			const json = await response.json();

			expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('WHERE people.pool_id = ?'), [1]);
			expect(json).toEqual(filteredPeople);
		});

		it('orders results by name', async () => {
			mockDb.all.mockResolvedValue(mockPeople);

			const req = new Request('http://localhost/api/people');
			await GET(req);

			expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('ORDER BY people.name'), []);
		});

		it('handles database errors', async () => {
			mockDb.all.mockRejectedValue(new Error('DB Error'));

			const req = new Request('http://localhost/api/people');
			const response = await GET(req);
			const json = await response.json();

			expect(response.status).toBe(500);
			expect(json).toEqual({ error: 'DB Error' });
		});
	});

	describe('POST /api/people', () => {
		it('creates a new person successfully', async () => {
			mockDb.get.mockResolvedValue({ id: 1 });
			mockDb.run.mockResolvedValue({ lastID: 5 });

			const req = new Request('http://localhost/api/people', {
				method: 'POST',
				body: JSON.stringify({ name: 'New Person', email: 'new@example.com', pool_id: 1 }),
			});

			const response = await POST(req);
			const json = await response.json();

			expect(mockDb.get).toHaveBeenCalledWith('SELECT id FROM pools WHERE id = ?', [1]);
			expect(mockDb.run).toHaveBeenCalledWith('INSERT INTO people (name, email, pool_id) VALUES (?, ?, ?)', ['New Person', 'new@example.com', 1]);
			expect(json).toMatchObject({
				id: 5,
				name: 'New Person',
				email: 'new@example.com',
				pool_id: 1,
				message: 'Person added successfully',
			});
		});

		it('returns 400 when name is missing', async () => {
			const req = new Request('http://localhost/api/people', {
				method: 'POST',
				body: JSON.stringify({ email: 'test@example.com', pool_id: 1 }),
			});

			const response = await POST(req);
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'Name and email are required' });
		});

		it('returns 400 when email is missing', async () => {
			const req = new Request('http://localhost/api/people', {
				method: 'POST',
				body: JSON.stringify({ name: 'Test Person', pool_id: 1 }),
			});

			const response = await POST(req);
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'Name and email are required' });
		});

		it('returns 400 when pool_id is missing', async () => {
			const req = new Request('http://localhost/api/people', {
				method: 'POST',
				body: JSON.stringify({ name: 'Test Person', email: 'test@example.com' }),
			});

			const response = await POST(req);
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'Pool is required. Please create a pool first.' });
		});

		it('returns 400 when pool does not exist', async () => {
			mockDb.get.mockResolvedValue(null);

			const req = new Request('http://localhost/api/people', {
				method: 'POST',
				body: JSON.stringify({ name: 'Test Person', email: 'test@example.com', pool_id: 999 }),
			});

			const response = await POST(req);
			const json = await response.json();

			expect(response.status).toBe(400);
			expect(json).toEqual({ error: 'Invalid pool selected' });
		});

		it('handles database errors', async () => {
			mockDb.get.mockRejectedValue(new Error('DB Error'));

			const req = new Request('http://localhost/api/people', {
				method: 'POST',
				body: JSON.stringify({ name: 'Test', email: 'test@example.com', pool_id: 1 }),
			});

			const response = await POST(req);
			const json = await response.json();

			expect(response.status).toBe(500);
			expect(json).toEqual({ error: 'DB Error' });
		});
	});

	describe('DELETE /api/people/[id]', () => {
		it('deletes a person successfully', async () => {
			mockDb.run.mockResolvedValue({ changes: 1 });

			const req = new NextRequest('http://localhost/api/people/5', { method: 'DELETE' });
			const response = await DELETE(req, { params: Promise.resolve({ id: '5' }) });
			const json = await response.json();

			expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM people WHERE id = ?', ['5']);
			expect(json).toEqual({ success: true });
		});

		it('handles deletion errors', async () => {
			mockDb.run.mockRejectedValue(new Error('Cannot delete'));

			const req = new NextRequest('http://localhost/api/people/5', { method: 'DELETE' });
			const response = await DELETE(req, { params: Promise.resolve({ id: '5' }) });

			const json = await response.json();

			expect(response.status).toBe(500);
			expect(json).toEqual({ error: 'Cannot delete' });
		});
	});
});
