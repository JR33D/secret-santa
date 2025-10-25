import { GET } from '@/app/api/history-graph/route';
import { getDb } from '@/lib/db';

jest.mock('@/lib/db');

describe('History Graph API Route', () => {
	let mockDb: any;

	beforeEach(() => {
		mockDb = {
			all: jest.fn(),
		};
		(getDb as jest.Mock).mockResolvedValue(mockDb);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('GET /api/history-graph', () => {
		const mockAssignments = [
			{ year: 2023, giver: 'Alice', receiver: 'Bob' },
			{ year: 2023, giver: 'Bob', receiver: 'Charlie' },
			{ year: 2024, giver: 'Charlie', receiver: 'Alice' },
		];

		it('returns nodes and links for all assignments', async () => {
			mockDb.all.mockResolvedValue(mockAssignments);

			const req = { url: 'http://localhost/api/history-graph' };
			const response = await GET(req as any);
			const json = await response.json();

			expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('SELECT'), []);
			expect(json.nodes).toContain('Alice');
			expect(json.nodes).toContain('Bob');
			expect(json.nodes).toContain('Charlie');
			expect(json.links).toEqual(mockAssignments);
		});

		it('filters by pool_id when provided', async () => {
			mockDb.all.mockResolvedValue(mockAssignments);

			const req = { url: 'http://localhost/api/history-graph?pool_id=5' };
			const response = await GET(req as any);
			const json = await response.json();

			expect(mockDb.all).toHaveBeenCalledWith(expect.stringContaining('WHERE a.pool_id = ?'), [5]);
			expect(json.nodes).toBeDefined();
			expect(json.links).toBeDefined();
		});

		it('returns empty arrays when no assignments exist', async () => {
			mockDb.all.mockResolvedValue([]);

			const req = { url: 'http://localhost/api/history-graph' };
			const response = await GET(req as any);
			const json = await response.json();

			expect(json.nodes).toEqual([]);
			expect(json.links).toEqual([]);
		});

		it('extracts unique nodes from assignments', async () => {
			const duplicateAssignments = [
				{ year: 2023, giver: 'Alice', receiver: 'Bob' },
				{ year: 2023, giver: 'Alice', receiver: 'Charlie' },
				{ year: 2024, giver: 'Bob', receiver: 'Alice' },
			];
			mockDb.all.mockResolvedValue(duplicateAssignments);

			const req = { url: 'http://localhost/api/history-graph' };
			const response = await GET(req as any);
			const json = await response.json();

			expect(json.nodes).toHaveLength(3);
			expect(json.nodes).toContain('Alice');
			expect(json.nodes).toContain('Bob');
			expect(json.nodes).toContain('Charlie');
		});

		it('handles database errors', async () => {
			mockDb.all.mockRejectedValue(new Error('DB Error'));

			const req = { url: 'http://localhost/api/history-graph' };
			const response = await GET(req as any);
			const json = await response.json();

			expect(response.status).toBe(500);
			expect(json).toEqual({ error: 'DB Error' });
		});
	});
});
