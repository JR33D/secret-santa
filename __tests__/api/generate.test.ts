import { NextRequest } from 'next/server';
import { POST } from '@/app/api/generate/[year]/route';

// Mock database
const mockDb = {
	all: jest.fn(),
	get: jest.fn(),
	run: jest.fn(),
};

jest.mock('@/lib/db', () => ({
	getDb: jest.fn(() => Promise.resolve(mockDb)),
}));

describe('Generate Assignments API', () => {
	const mockPeople = [
		{ id: 1, name: 'Alice', email: 'alice@example.com' },
		{ id: 2, name: 'Bob', email: 'bob@example.com' },
		{ id: 3, name: 'Charlie', email: 'charlie@example.com' },
	];

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should generate assignments successfully', async () => {
		mockDb.all.mockResolvedValueOnce(mockPeople); // Get people
		mockDb.get.mockResolvedValueOnce({ count: 0 }); // Check existing
		mockDb.all.mockResolvedValueOnce([]); // Get restrictions
		mockDb.run.mockResolvedValue({ lastID: 1 });

	const request = new NextRequest('http://localhost/api/generate/2024?pool_id=1');
		const response = await POST(request, { params: { year: '2024' } });
		const data = await response.json();

		expect(data.success).toBe(true);
		expect(data.message).toContain('Successfully generated');
		expect(mockDb.run).toHaveBeenCalledTimes(3); // One insert per person
	});

	it('should fail with less than 2 people', async () => {
		mockDb.all.mockResolvedValueOnce([mockPeople[0]]); // Only 1 person

	const request = new NextRequest('http://localhost/api/generate/2024?pool_id=1');
		const response = await POST(request, { params: { year: '2024' } });
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.message).toContain('Need at least 2 people');
	});

	it('should fail if assignments already exist', async () => {
		mockDb.all.mockResolvedValueOnce(mockPeople);
		mockDb.get.mockResolvedValueOnce({ count: 3 }); // Existing assignments

	const request = new NextRequest('http://localhost/api/generate/2024?pool_id=1');
		const response = await POST(request, { params: { year: '2024' } });
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.message).toContain('already exist');
	});

	it('should respect restrictions', async () => {
		const restrictions = [
			{ giver_id: 1, receiver_id: 2 }, // Alice can't give to Bob
		];

		mockDb.all.mockResolvedValueOnce(mockPeople);
		mockDb.get.mockResolvedValueOnce({ count: 0 });
		mockDb.all.mockResolvedValueOnce(restrictions);
		mockDb.run.mockResolvedValue({ lastID: 1 });

	const request = new NextRequest('http://localhost/api/generate/2024?pool_id=1');
		const response = await POST(request, { params: { year: '2024' } });
		const data = await response.json();

		// Should successfully generate with restrictions
		expect(data.success).toBe(true);

		// Verify no assignment breaks restrictions
		const runCalls = mockDb.run.mock.calls;
		const aliceAssignment = runCalls.find((call) => call[0].includes('INSERT INTO assignments') && call[1][1] === 1);

		if (aliceAssignment) {
			expect(aliceAssignment[1][2]).not.toBe(2); // Alice shouldn't give to Bob
		}
	});

	it('should handle impossible restriction scenarios', async () => {
		// Create impossible restrictions (everyone restricted from everyone else)
		const impossibleRestrictions = [
			{ giver_id: 1, receiver_id: 2 },
			{ giver_id: 1, receiver_id: 3 },
			{ giver_id: 2, receiver_id: 1 },
			{ giver_id: 2, receiver_id: 3 },
			{ giver_id: 3, receiver_id: 1 },
			{ giver_id: 3, receiver_id: 2 },
		];

		mockDb.all.mockResolvedValueOnce(mockPeople);
		mockDb.get.mockResolvedValueOnce({ count: 0 });
		mockDb.all.mockResolvedValueOnce(impossibleRestrictions);

	const request = new NextRequest('http://localhost/api/generate/2024?pool_id=1');
		const response = await POST(request, { params: { year: '2024' } });
		const data = await response.json();

		expect(response.status).toBe(400);
		expect(data.message).toContain('Could not generate valid assignments');
	});

	it('should handle database errors', async () => {
		mockDb.all.mockRejectedValueOnce(new Error('Database error'));

		const request = new NextRequest('http://localhost/api/generate/2024?pool_id=1');
		const response = await POST(request, { params: { year: '2024' } });
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.error).toBe('Database error');
	});
});
