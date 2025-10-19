import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoryTab from '@/components/HistoryTab';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('HistoryTab Component', () => {
	const mockPools = [
		{ id: 1, name: 'Family' },
		{ id: 2, name: 'Friends' },
	];

	const mockGraphData = {
		nodes: ['John', 'Jane', 'Bob'],
		links: [
			{ year: 2023, giver: 'John', receiver: 'Jane' },
			{ year: 2023, giver: 'Jane', receiver: 'Bob' },
			{ year: 2024, giver: 'Bob', receiver: 'John' },
		],
	};

	const mockAssignments = [
		{
			year: 2023,
			giver_name: 'John',
			receiver_name: 'Jane',
			pool_name: 'Family',
		},
		{
			year: 2023,
			giver_name: 'Jane',
			receiver_name: 'Bob',
			pool_name: 'Family',
		},
		{
			year: 2023,
			giver_name: 'Bob',
			receiver_name: 'John',
			pool_name: 'Family',
		},
	];

	let mockCanvasContext: any;

	beforeEach(() => {
		jest.clearAllMocks();

		mockCanvasContext = {
			clearRect: jest.fn(),
			fillText: jest.fn(),
			fillRect: jest.fn(),
			beginPath: jest.fn(),
			moveTo: jest.fn(),
			lineTo: jest.fn(),
			stroke: jest.fn(),
			arc: jest.fn(),
			fill: jest.fn(),
			set fillStyle(value: string) {},
			set strokeStyle(value: string) {},
			set lineWidth(value: number) {},
			set font(value: string) {},
			set textAlign(value: string) {},
			set textBaseline(value: string) {},
		};

		HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCanvasContext);
		Object.defineProperty(HTMLCanvasElement.prototype, 'offsetWidth', {
			configurable: true,
			value: 800,
		});
		Object.defineProperty(HTMLCanvasElement.prototype, 'offsetHeight', {
			configurable: true,
			value: 500,
		});

		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve(mockPools);
			if (url.includes('/api/history-graph')) return Promise.resolve(mockGraphData);
			if (url.includes('/api/assignments')) return Promise.resolve(mockAssignments);
			return Promise.resolve([]);
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('renders the component with title', async () => {
		render(<HistoryTab />);

		await waitFor(() => {
			expect(screen.getByText('Assignment History')).toBeInTheDocument();
		});
	});

	it('loads pools on mount', async () => {
		render(<HistoryTab />);

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/pools');
		});
	});

	it('loads graph data on mount', async () => {
		render(<HistoryTab />);

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/history-graph');
		});
	});

	it('renders canvas element', async () => {
		render(<HistoryTab />);

		await waitFor(() => {
			const canvas = screen.getByRole('img', { hidden: true });
			expect(canvas).toBeInTheDocument();
		});
	});

	it('filters by pool when pool is selected', async () => {
		render(<HistoryTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Filter by Pool')).toBeInTheDocument();
		});

		const poolSelect = screen.getByLabelText('Filter by Pool');
		fireEvent.change(poolSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/history-graph?pool_id=1');
			expect(api.apiGet).toHaveBeenCalledWith('/api/assignments?pool_id=1');
		});
	});

	it('displays "All Pools" option in filter', async () => {
		render(<HistoryTab />);

		await waitFor(() => {
			expect(screen.getByText('All Pools')).toBeInTheDocument();
		});
	});

	it('displays assignment chains', async () => {
		render(<HistoryTab />);

		await waitFor(() => {
			expect(screen.getByText('All Chains')).toBeInTheDocument();
		});
	});

	it('shows empty state when no history exists', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve(mockPools);
			if (url.includes('/api/history-graph')) return Promise.resolve({ nodes: [], links: [] });
			if (url.includes('/api/assignments')) return Promise.resolve([]);
			return Promise.resolve([]);
		});

		render(<HistoryTab />);

		await waitFor(() => {
			expect(screen.getByText('No history yet')).toBeInTheDocument();
		});
	});

	it('draws canvas when graph data is available', async () => {
		render(<HistoryTab />);

		await waitFor(() => {
			expect(mockCanvasContext.clearRect).toHaveBeenCalled();
			expect(mockCanvasContext.beginPath).toHaveBeenCalled();
		});
	});

	it('displays "No assignment history yet" message on empty canvas', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve(mockPools);
			if (url.includes('/api/history-graph')) return Promise.resolve({ nodes: [], links: [] });
			if (url.includes('/api/assignments')) return Promise.resolve([]);
			return Promise.resolve([]);
		});

		render(<HistoryTab />);

		await waitFor(() => {
			expect(mockCanvasContext.fillText).toHaveBeenCalledWith('No assignment history yet', expect.any(Number), expect.any(Number));
		});
	});

	it('detects loops in assignment chains', async () => {
		const loopAssignments = [
			{ year: 2023, giver_name: 'John', receiver_name: 'Jane', pool_name: 'Family' },
			{ year: 2023, giver_name: 'Jane', receiver_name: 'Bob', pool_name: 'Family' },
			{ year: 2023, giver_name: 'Bob', receiver_name: 'John', pool_name: 'Family' },
		];

		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve(mockPools);
			if (url.includes('/api/history-graph')) return Promise.resolve(mockGraphData);
			if (url.includes('/api/assignments')) return Promise.resolve(loopAssignments);
			return Promise.resolve([]);
		});

		render(<HistoryTab />);

		await waitFor(() => {
			expect(screen.getByText(/Loop/i)).toBeInTheDocument();
		});
	});

	it('groups assignments by year', async () => {
		const multiYearAssignments = [
			{ year: 2023, giver_name: 'John', receiver_name: 'Jane', pool_name: 'Family' },
			{ year: 2024, giver_name: 'Jane', receiver_name: 'Bob', pool_name: 'Family' },
		];

		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve(mockPools);
			if (url.includes('/api/history-graph')) return Promise.resolve(mockGraphData);
			if (url.includes('/api/assignments')) return Promise.resolve(multiYearAssignments);
			return Promise.resolve([]);
		});

		render(<HistoryTab />);

		await waitFor(() => {
			const chainsText = screen.getByText(/2023 - Family/i);
			expect(chainsText).toBeInTheDocument();
		});
	});

	it('reloads data when pool filter changes', async () => {
		render(<HistoryTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Filter by Pool')).toBeInTheDocument();
		});

		const initialCalls = (api.apiGet as jest.Mock).mock.calls.length;

		const poolSelect = screen.getByLabelText('Filter by Pool');
		fireEvent.change(poolSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect((api.apiGet as jest.Mock).mock.calls.length).toBeGreaterThan(initialCalls);
		});
	});

	it('draws nodes as circles on canvas', async () => {
		render(<HistoryTab />);

		await waitFor(() => {
			expect(mockCanvasContext.arc).toHaveBeenCalled();
			expect(mockCanvasContext.fill).toHaveBeenCalled();
		});
	});

	it('draws links with arrows on canvas', async () => {
		render(<HistoryTab />);

		await waitFor(() => {
			expect(mockCanvasContext.lineTo).toHaveBeenCalled();
			expect(mockCanvasContext.stroke).toHaveBeenCalled();
		});
	});

	it('draws legend for years on canvas', async () => {
		render(<HistoryTab />);

		await waitFor(() => {
			expect(mockCanvasContext.fillRect).toHaveBeenCalled();
		});
	});
});
