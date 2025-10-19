import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RestrictionsTab from '@/components/RestrictionsTab';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('RestrictionsTab Component', () => {
	const mockPools = [
		{ id: 1, name: 'Family' },
		{ id: 2, name: 'Friends' },
	];

	const mockPeople = [
		{ id: 1, name: 'John Doe', pool_id: 1 },
		{ id: 2, name: 'Jane Smith', pool_id: 1 },
		{ id: 3, name: 'Bob Johnson', pool_id: 2 },
	];

	const mockRestrictions = [{ id: 1, giver_id: 1, receiver_id: 2, giver_name: 'John Doe', receiver_name: 'Jane Smith' }];

	beforeEach(() => {
		jest.clearAllMocks();
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve(mockPools);
			if (url === '/api/restrictions') return Promise.resolve(mockRestrictions);
			if (url.includes('/api/people?pool_id=1')) return Promise.resolve(mockPeople.filter((p) => p.pool_id === 1));
			if (url.includes('/api/people?pool_id=2')) return Promise.resolve(mockPeople.filter((p) => p.pool_id === 2));
			return Promise.resolve([]);
		});
		(api.apiPost as jest.Mock).mockResolvedValue({ success: true });
		(api.apiDelete as jest.Mock).mockResolvedValue({ success: true });
		global.alert = jest.fn();
		global.confirm = jest.fn(() => true);
	});

	it('renders the component with title', async () => {
		render(<RestrictionsTab />);

		await waitFor(() => {
			expect(screen.getByText('Manage Restrictions')).toBeInTheDocument();
		});
	});

	it('loads pools and restrictions on mount', async () => {
		render(<RestrictionsTab />);

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/pools');
			expect(api.apiGet).toHaveBeenCalledWith('/api/restrictions');
		});
	});

	it('shows warning when no pools exist', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve([]);
			if (url === '/api/restrictions') return Promise.resolve([]);
			return Promise.resolve([]);
		});

		render(<RestrictionsTab />);

		await waitFor(() => {
			expect(screen.getByText(/Please create a pool and add people first/i)).toBeInTheDocument();
		});
	});

	it('loads people when pool is selected', async () => {
		render(<RestrictionsTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Pool')).toBeInTheDocument();
		});

		const poolSelect = screen.getByLabelText('Select Pool');
		fireEvent.change(poolSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/people?pool_id=1');
		});
	});

	it('shows warning when pool has less than 2 people', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve(mockPools);
			if (url === '/api/restrictions') return Promise.resolve([]);
			if (url.includes('/api/people?pool_id=1')) return Promise.resolve([mockPeople[0]]);
			return Promise.resolve([]);
		});

		render(<RestrictionsTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Pool')).toBeInTheDocument();
		});

		const poolSelect = screen.getByLabelText('Select Pool');
		fireEvent.change(poolSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(screen.getByText(/This pool needs at least 2 people to add restrictions/i)).toBeInTheDocument();
		});
	});

	it('adds a restriction successfully', async () => {
		render(<RestrictionsTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Pool')).toBeInTheDocument();
		});

		const poolSelect = screen.getByLabelText('Select Pool');
		fireEvent.change(poolSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(screen.getByLabelText('Giver')).toBeInTheDocument();
		});

		const giverSelect = screen.getByLabelText('Giver');
		const receiverSelect = screen.getByLabelText('Cannot Give To');
		const addButton = screen.getByText('Add Restriction');

		fireEvent.change(giverSelect, { target: { value: '1' } });
		fireEvent.change(receiverSelect, { target: { value: '2' } });
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith('/api/restrictions', {
				giver_id: 1,
				receiver_id: 2,
			});
		});
	});

	it('shows alert when giver and receiver are not selected', async () => {
		render(<RestrictionsTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Pool')).toBeInTheDocument();
		});

		const poolSelect = screen.getByLabelText('Select Pool');
		fireEvent.change(poolSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(screen.getByLabelText('Giver')).toBeInTheDocument();
		});

		const addButton = screen.getByText('Add Restriction');
		fireEvent.click(addButton);

		expect(global.alert).toHaveBeenCalledWith('Select both giver and receiver');
	});

	it('shows alert when giver and receiver are the same', async () => {
		render(<RestrictionsTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Pool')).toBeInTheDocument();
		});

		const poolSelect = screen.getByLabelText('Select Pool');
		fireEvent.change(poolSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(screen.getByLabelText('Giver')).toBeInTheDocument();
		});

		const giverSelect = screen.getByLabelText('Giver');
		const receiverSelect = screen.getByLabelText('Cannot Give To');
		const addButton = screen.getByText('Add Restriction');

		fireEvent.change(giverSelect, { target: { value: '1' } });
		fireEvent.change(receiverSelect, { target: { value: '1' } });
		fireEvent.click(addButton);

		expect(global.alert).toHaveBeenCalledWith('Cannot restrict same person');
	});

	it('displays existing restrictions', async () => {
		render(<RestrictionsTab />);

		await waitFor(() => {
			const strongJohn = screen.getByText((content, node) => node?.tagName === 'STRONG' && content.trim() === 'John Doe');
			const strongJane = screen.getByText((content, node) => node?.tagName === 'STRONG' && content.trim() === 'Jane Smith');
			expect(strongJohn).toBeInTheDocument();
			expect(strongJane).toBeInTheDocument();
		});
	});

	it('deletes a restriction when confirmed', async () => {
		render(<RestrictionsTab />);

		await waitFor(() => {
			const strongJohn = screen.getByText((content, node) => node?.tagName === 'STRONG' && content.trim() === 'John Doe');
			expect(strongJohn).toBeInTheDocument();
		});

		const deleteButtons = screen.getAllByText('Delete');
		fireEvent.click(deleteButtons[0]);

		expect(global.confirm).toHaveBeenCalledWith('Remove this restriction?');

		await waitFor(() => {
			expect(api.apiDelete).toHaveBeenCalledWith('/api/restrictions/1');
		});
	});

	it('does not delete when user cancels confirmation', async () => {
		(global.confirm as jest.Mock).mockReturnValue(false);

		render(<RestrictionsTab />);

		await waitFor(() => {
			const strongJohn = screen.getByText((content, node) => node?.tagName === 'STRONG' && content.trim() === 'John Doe');
			expect(strongJohn).toBeInTheDocument();
		});

		const deleteButtons = screen.getAllByText('Delete');
		fireEvent.click(deleteButtons[0]);

		expect(api.apiDelete).not.toHaveBeenCalled();
	});

	it('filters restrictions by selected pool', async () => {
		const mixedRestrictions = [
			{ id: 1, giver_id: 1, receiver_id: 2, giver_name: 'John Doe', receiver_name: 'Jane Smith' },
			{ id: 2, giver_id: 3, receiver_id: 1, giver_name: 'Bob Johnson', receiver_name: 'John Doe' },
		];

		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve(mockPools);
			if (url === '/api/restrictions') return Promise.resolve(mixedRestrictions);
			if (url.includes('/api/people?pool_id=1')) return Promise.resolve(mockPeople.filter((p) => p.pool_id === 1));
			return Promise.resolve([]);
		});

		render(<RestrictionsTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Pool')).toBeInTheDocument();
		});

		const poolSelect = screen.getByLabelText('Select Pool');
		fireEvent.change(poolSelect, { target: { value: '1' } });

		await waitFor(() => {
			const strongJohn = screen.getByText((content, node) => node?.tagName === 'STRONG' && content.trim() === 'John Doe');
			expect(strongJohn).toBeInTheDocument();
		});
	});

	it('clears form selections when pool is changed', async () => {
		render(<RestrictionsTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Pool')).toBeInTheDocument();
		});

		const poolSelect = screen.getByLabelText('Select Pool');
		fireEvent.change(poolSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(screen.getByLabelText('Giver')).toBeInTheDocument();
		});

		const giverSelect = screen.getByLabelText('Giver') as HTMLSelectElement;
		const receiverSelect = screen.getByLabelText('Cannot Give To') as HTMLSelectElement;

		fireEvent.change(giverSelect, { target: { value: '1' } });
		fireEvent.change(receiverSelect, { target: { value: '2' } });

		fireEvent.change(poolSelect, { target: { value: '2' } });

		await waitFor(() => {
			expect(giverSelect.value).toBe('');
			expect(receiverSelect.value).toBe('');
		});
	});

	it('shows empty state when no restrictions exist', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve(mockPools);
			if (url === '/api/restrictions') return Promise.resolve([]);
			if (url.includes('/api/people?pool_id=1')) return Promise.resolve(mockPeople.filter((p) => p.pool_id === 1));
			return Promise.resolve([]);
		});

		render(<RestrictionsTab />);

		await waitFor(() => {
			expect(screen.getByText('No restrictions set')).toBeInTheDocument();
		});
	});

	it('handles API errors gracefully', async () => {
		(api.apiPost as jest.Mock).mockRejectedValue(new Error('API Error'));

		render(<RestrictionsTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Pool')).toBeInTheDocument();
		});

		const poolSelect = screen.getByLabelText('Select Pool');
		fireEvent.change(poolSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(screen.getByLabelText('Giver')).toBeInTheDocument();
		});

		const giverSelect = screen.getByLabelText('Giver');
		const receiverSelect = screen.getByLabelText('Cannot Give To');
		const addButton = screen.getByText('Add Restriction');

		fireEvent.change(giverSelect, { target: { value: '1' } });
		fireEvent.change(receiverSelect, { target: { value: '2' } });
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith('API Error');
		});
	});
});
