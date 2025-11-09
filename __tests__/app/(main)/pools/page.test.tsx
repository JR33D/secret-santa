import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page from '@/app/(main)/pools/page';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('Pools Management Page', () => {
	const mockPools = [
		{ id: 1, name: 'Family', description: 'Annual family gift exchange', member_count: 3 },
		{ id: 2, name: 'Friends', description: 'Friends group', member_count: 5 },
	];

	beforeEach(() => {
		jest.clearAllMocks();
		(api.apiGet as jest.Mock).mockResolvedValue(mockPools);
		(api.apiPost as jest.Mock).mockResolvedValue({});
		(api.apiDelete as jest.Mock).mockResolvedValue({});
		global.alert = jest.fn();
		global.confirm = jest.fn(() => true);
	});

	it('renders the pools management page', async () => {
		render(<Page />);

		expect(screen.getByText('Manage Pools')).toBeInTheDocument();
		expect(screen.getByLabelText('Pool Name')).toBeInTheDocument();
		expect(screen.getByLabelText('Description (Optional)')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Create Pool/i })).toBeInTheDocument();
		expect(screen.getByText('Current Pools')).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText('Family')).toBeInTheDocument();
			expect(screen.getByText('Friends')).toBeInTheDocument();
		});
	});

	it('loads pools on mount', async () => {
		render(<Page />);
		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/pools');
		});
	});

	it('adds a new pool', async () => {
		render(<Page />);

		fireEvent.change(screen.getByLabelText('Pool Name'), { target: { value: 'Coworkers' } });
		fireEvent.change(screen.getByLabelText('Description (Optional)'), { target: { value: 'Office gift exchange' } });
		fireEvent.click(screen.getByRole('button', { name: /Create Pool/i }));

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith('/api/pools', {
				name: 'Coworkers',
				description: 'Office gift exchange',
			});
			expect(api.apiGet).toHaveBeenCalledTimes(2); // Initial load + reload after add
		});
	});

	it('removes a pool', async () => {
		render(<Page />);

		await waitFor(() => {
			expect(screen.getByText('Family')).toBeInTheDocument();
		});

		fireEvent.click(screen.getAllByRole('button', { name: /Delete/i })[0]); // Click delete for Family

		await waitFor(() => {
			expect(global.confirm).toHaveBeenCalledWith('Delete this pool? All people must be removed from it first.');
			expect(api.apiDelete).toHaveBeenCalledWith('/api/pools/1');
			expect(api.apiGet).toHaveBeenCalledTimes(2); // Initial load + reload after delete
		});
	});

	it('shows empty pools message when no pools', async () => {
		(api.apiGet as jest.Mock).mockResolvedValue([]); // No pools
		render(<Page />);

		await waitFor(() => {
			expect(screen.getByText('No pools yet')).toBeInTheDocument();
		});
	});

	it('shows loading state', () => {
		(api.apiGet as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolve
		render(<Page />);
		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});
});
