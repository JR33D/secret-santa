import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page from '@/app/(main)/history/page';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

// Mock canvas context with proper typing
const mockCtx = {
	clearRect: jest.fn(),
	fillText: jest.fn(),
	beginPath: jest.fn(),
	moveTo: jest.fn(),
	lineTo: jest.fn(),
	stroke: jest.fn(),
	fill: jest.fn(),
	arc: jest.fn(),
	fillRect: jest.fn(),
	canvas: { width: 500, height: 500 },
};

const mockGetContext = jest.fn(() => mockCtx);

beforeAll(() => {
	jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(mockGetContext as unknown as typeof HTMLCanvasElement.prototype.getContext);
});

afterAll(() => {
	jest.restoreAllMocks();
});

describe('Assignment History Page', () => {
	const mockPools = [{ id: 1, name: 'Family' }];

	const mockGraphData = {
		nodes: ['Alice', 'Bob', 'Charlie'],
		links: [
			{ year: 2023, giver: 'Alice', receiver: 'Bob' },
			{ year: 2023, giver: 'Bob', receiver: 'Charlie' },
			{ year: 2023, giver: 'Charlie', receiver: 'Alice' },
		],
	};

	const mockAssignments = [
		{ year: 2023, giver_name: 'Alice', receiver_name: 'Bob', pool_name: 'Family' },
		{ year: 2023, giver_name: 'Bob', receiver_name: 'Charlie', pool_name: 'Family' },
		{ year: 2023, giver_name: 'Charlie', receiver_name: 'Alice', pool_name: 'Family' },
	];

	beforeEach(() => {
		jest.clearAllMocks();

		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url.includes('/api/pools')) return Promise.resolve(mockPools);
			if (url.includes('/api/history-graph')) return Promise.resolve(mockGraphData);
			if (url.includes('/api/assignments')) return Promise.resolve(mockAssignments);
			return Promise.resolve([]);
		});
	});

	it('renders the assignment history page', async () => {
		render(<Page />);

		await screen.findByText('Assignment History');

		expect(screen.getByLabelText('Filter by Pool')).toBeInTheDocument();
		expect(screen.getByLabelText('Assignment History Graph')).toBeInTheDocument();
		expect(screen.getByText('All Chains')).toBeInTheDocument();

		const familyOption = await screen.findByText('Family');
		expect(familyOption).toBeInTheDocument();
	});

	it('loads pools and graph data on mount', async () => {
		render(<Page />);

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/pools');
			expect(api.apiGet).toHaveBeenCalledWith('/api/history-graph');
			expect(api.apiGet).toHaveBeenCalledWith('/api/assignments');
		});
	});

	it('draws the graph on canvas', async () => {
		render(<Page />);

		await waitFor(() => {
			expect(mockGetContext).toHaveBeenCalledWith('2d');
		});

		expect(mockCtx.clearRect).toHaveBeenCalled();
		expect(mockCtx.beginPath).toHaveBeenCalled();
		expect(mockCtx.stroke).toHaveBeenCalled();
	});

	it('displays chains correctly', async () => {
		render(<Page />);

		await screen.findByText(/2023 - Family:/i);

		expect(screen.getByText(/Alice/i)).toBeInTheDocument();
		expect(screen.getByText(/Bob/i)).toBeInTheDocument();
		expect(screen.getByText(/Charlie/i)).toBeInTheDocument();
	});

	it('handles no history gracefully', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url.includes('/api/pools')) return Promise.resolve([]);
			if (url.includes('/api/history-graph')) return Promise.resolve({ nodes: [], links: [] });
			if (url.includes('/api/assignments')) return Promise.resolve([]);
			return Promise.resolve([]);
		});

		render(<Page />);
		await screen.findByText(/No history yet/i);
	});
});
