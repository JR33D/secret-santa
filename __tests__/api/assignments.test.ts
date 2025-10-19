// __tests__/assignments.test.ts
import { GET as getAssignments } from '@/app/api/assignments/route';
import { GET as getAssignmentsByYear, DELETE as deleteAssignmentsByYear } from '@/app/api/assignments/[year]/route';
import { getDb } from '@/lib/db';

jest.mock('@/lib/db');

describe('Assignments API Routes', () => {
	let mockDb: any;

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

	// -------------------------
	// /assignments/route.ts GET
	// -------------------------
	describe('/assignments GET', () => {
		it('returns all assignments if no pool_id', async () => {
			const fakeData = [{ id: 1, giver_name: 'Alice', receiver_name: 'Bob', pool_name: 'Family' }];
			mockDb.all.mockResolvedValue(fakeData);

			const req = { url: 'http://localhost/api/assignments' };
			const response = await getAssignments(req as any);
			const json = await response.json();

			expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('SELECT'), []);
			expect(json).toEqual(fakeData);
		});

		it('returns assignments filtered by pool_id', async () => {
			const fakeData = [{ id: 2, giver_name: 'Carol', receiver_name: 'Dave', pool_name: 'Friends' }];
			mockDb.all.mockResolvedValue(fakeData);

			const req = { url: 'http://localhost/api/assignments?pool_id=5' };
			const response = await getAssignments(req as any);
			const json = await response.json();

			expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('WHERE a.pool_id = ?'), [5]);
			expect(json).toEqual(fakeData);
		});

		it('handles database errors gracefully', async () => {
			mockDb.all.mockRejectedValue(new Error('DB Error'));
			const req = { url: 'http://localhost/api/assignments' };

			const response = await getAssignments(req as any);
			const json = await response.json();

			expect(json).toEqual({ error: 'DB Error' });
		});
	});

	// -----------------------------------------
	// /assignments/[id]/route.ts GET and DELETE
	// -----------------------------------------
	describe('/assignments/[year] GET', () => {
		it('returns assignments for a specific year', async () => {
			const fakeData = [{ id: 1, giver_name: 'Alice', receiver_name: 'Bob', pool_name: 'Family' }];
			mockDb.all.mockResolvedValue(fakeData);

			const req = { url: 'http://localhost/api/assignments/2025' };
			const response = await getAssignmentsByYear(req as any, { params: { year: '2025' } });
			const json = await response.json();

			expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('WHERE a.year = ?'), [2025]);
			expect(json).toEqual(fakeData);
		});

		it('filters by pool_id', async () => {
			const fakeData = [{ id: 2, giver_name: 'Carol', receiver_name: 'Dave', pool_name: 'Friends' }];
			mockDb.all.mockResolvedValue(fakeData);

			const req = { url: 'http://localhost/api/assignments/2025?pool_id=3' };
			const response = await getAssignmentsByYear(req as any, { params: { year: '2025' } });
			const json = await response.json();

			expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('AND a.pool_id = ?'), [2025, 3]);
			expect(json).toEqual(fakeData);
		});

		it('handles errors gracefully', async () => {
			mockDb.all.mockRejectedValue(new Error('DB Error'));
			const req = { url: 'http://localhost/api/assignments/2025' };

			const response = await getAssignmentsByYear(req as any, { params: { year: '2025' } });
			const json = await response.json();

			expect(json).toEqual({ error: 'DB Error' });
		});
	});

	describe('/assignments/[year] DELETE', () => {
		it('deletes assignments for a specific year', async () => {
			const req = { url: 'http://localhost/api/assignments/2025' };

			const response = await deleteAssignmentsByYear(req as any, { params: { year: '2025' } });
			const json = await response.json();

			expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM assignments WHERE year = ?', [2025]);
			expect(json).toEqual({ message: 'Assignments deleted successfully' });
		});

		it('deletes assignments filtered by pool_id', async () => {
			const req = { url: 'http://localhost/api/assignments/2025?pool_id=2' };

			const response = await deleteAssignmentsByYear(req as any, { params: { year: '2025' } });
			const json = await response.json();

			expect(mockDb.run).toHaveBeenCalledWith('DELETE FROM assignments WHERE year = ? AND pool_id = ?', [2025, 2]);
			expect(json).toEqual({ message: 'Assignments deleted successfully' });
		});

		it('handles errors gracefully', async () => {
			mockDb.run.mockRejectedValue(new Error('DB Error'));
			const req = { url: 'http://localhost/api/assignments/2025' };

			const response = await deleteAssignmentsByYear(req as any, { params: { year: '2025' } });
			const json = await response.json();

			expect(json).toEqual({ error: 'DB Error' });
		});
	});
});
