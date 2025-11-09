import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page from '@/app/(main)/restrictions/page';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('Restrictions Management Page', () => {
	const mockPools = [
		{ id: 1, name: 'Family' },
		{ id: 2, name: 'Friends' },
	];
	const mockPeople = [
		{ id: 101, name: 'Alice', pool_id: 1 },
		{ id: 102, name: 'Bob', pool_id: 1 },
		{ id: 103, name: 'Charlie', pool_id: 1 },
		{ id: 104, name: 'David', pool_id: 2 },
	];
	const mockRestrictions = [
		{ id: 1, giver_id: 101, giver_name: 'Alice', receiver_id: 102, receiver_name: 'Bob' },
	];

	beforeEach(() => {
		jest.clearAllMocks();
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url.includes('/api/pools')) {
				return Promise.resolve(mockPools);
			}
			if (url.includes('/api/people')) {
				return Promise.resolve(mockPeople.filter((p) => String(p.pool_id) === url.split('pool_id=')[1]));
			}
			if (url.includes('/api/restrictions')) {
				return Promise.resolve(mockRestrictions);
			}
			return Promise.resolve([]);
		});
		(api.apiPost as jest.Mock).mockResolvedValue({});
		(api.apiDelete as jest.Mock).mockResolvedValue({});
		global.alert = jest.fn();
		global.confirm = jest.fn(() => true);
	});

	it('renders the restrictions management page', async () => {
		render(<Page />);

		await waitFor(() => {
			expect(screen.getByText('Manage Restrictions')).toBeInTheDocument();
			expect(screen.getByLabelText('Select Pool')).toBeInTheDocument();
			expect(screen.getByText(/Current Restrictions/i)).toBeInTheDocument();
			expect(screen.getByRole('option', { name: 'Family' })).toBeInTheDocument(); // Ensure pools are loaded
		});
	});

	it('loads pools and restrictions on mount', async () => {
		render(<Page />);
		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/pools');
			expect(api.apiGet).toHaveBeenCalledWith('/api/restrictions');
		});
	});

	it('loads people when a pool is selected', async () => {
		render(<Page />);

		await waitFor(() => {
			fireEvent.change(screen.getByLabelText('Select Pool'), { target: { value: '1' } });
		});

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/people?pool_id=1');
			expect(screen.getByLabelText('Giver')).toBeInTheDocument();
			expect(screen.getByLabelText('Cannot Give To')).toBeInTheDocument();
		});
	});

	it('adds a new restriction', async () => {
		render(<Page />);

		await waitFor(() => {
			fireEvent.change(screen.getByLabelText('Select Pool'), { target: { value: '1' } });
		});
		await waitFor(() => {
			fireEvent.change(screen.getByLabelText('Giver'), { target: { value: '102' } }); // Bob
			fireEvent.change(screen.getByLabelText('Cannot Give To'), { target: { value: '103' } }); // Charlie
		});

		fireEvent.click(screen.getByRole('button', { name: /Add Restriction/i }));

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith('/api/restrictions', {
				giver_id: 102,
				receiver_id: 103,
			});
			expect(api.apiGet).toHaveBeenCalledTimes(4); // 2 initial + people load + restrictions reload
		});
	});

	it('removes a restriction', async () => {
		render(<Page />);

		await waitFor(() => {
			fireEvent.change(screen.getByLabelText('Select Pool'), { target: { value: '1' } });
		});
		
		// Wait for restrictions to load - look for the restriction components
		await waitFor(() => {
			expect(screen.getByText(/Alice/i, { selector: 'strong' })).toBeInTheDocument();
			expect(screen.getByText(/Bob/i, { selector: 'strong' })).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: /Delete/i }));

		await waitFor(() => {
			expect(global.confirm).toHaveBeenCalledWith('Remove this restriction?');
			expect(api.apiDelete).toHaveBeenCalledWith('/api/restrictions/1');
			expect(screen.queryByText('Alice → ❌ → Bob')).not.toBeInTheDocument(); // Assert that restriction is removed
			expect(api.apiGet).toHaveBeenCalledTimes(4); // 2 initial + people load + restrictions reload
		});
	});

	it('shows warning if no pools exist', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url.includes('/api/pools')) {
				return Promise.resolve([]);
			}
			return Promise.resolve([]);
		});

		render(<Page />);

		await waitFor(() => {
			expect(screen.getByText('⚠️ Please create a pool and add people first.')).toBeInTheDocument();
		});
	});

	it('shows warning if selected pool has less than 2 people', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url.includes('/api/pools')) {
				return Promise.resolve(mockPools);
			}
			if (url.includes('/api/people')) {
				return Promise.resolve([{ id: 101, name: 'Alice', pool_id: 1 }]); // Only one person
			}
			if (url.includes('/api/restrictions')) {
				return Promise.resolve([]);
			}
			return Promise.resolve([]);
		});

		render(<Page />);

		await waitFor(() => {
			fireEvent.change(screen.getByLabelText('Select Pool'), { target: { value: '1' } });
		});

		await waitFor(() => {
			expect(screen.getByText('This pool needs at least 2 people to add restrictions.')).toBeInTheDocument();
		});
	});

	it('prevents adding restriction for the same person', async () => {
		render(<Page />);

		await waitFor(() => {
			fireEvent.change(screen.getByLabelText('Select Pool'), { target: { value: '1' } });
		});
		await waitFor(() => {
			fireEvent.change(screen.getByLabelText('Giver'), { target: { value: '101' } }); // Alice
			fireEvent.change(screen.getByLabelText('Cannot Give To'), { target: { value: '101' } }); // Alice
		});

		fireEvent.click(screen.getByRole('button', { name: /Add Restriction/i }));

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith('Cannot restrict same person');
			expect(api.apiPost).not.toHaveBeenCalled();
		});
	});
});