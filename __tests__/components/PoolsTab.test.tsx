import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PoolsTab from '@/components/PoolsTab';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('PoolsTab Component', () => {
	const mockPools = [
		{ id: 1, name: 'Family', description: 'Family gift exchange', member_count: 5 },
		{ id: 2, name: 'Friends', description: 'Friends group', member_count: 3 },
	];

	beforeEach(() => {
		jest.clearAllMocks();
		(api.apiGet as jest.Mock).mockResolvedValue(mockPools);
		(api.apiPost as jest.Mock).mockResolvedValue({ success: true });
		(api.apiDelete as jest.Mock).mockResolvedValue({ success: true });
		global.alert = jest.fn();
		global.confirm = jest.fn(() => true);
	});

	it('renders the component with title', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText('Manage Pools')).toBeInTheDocument();
		});
	});

	it('displays description text', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText(/Create separate pools for different groups/i)).toBeInTheDocument();
		});
	});

	it('loads pools on mount', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/pools');
		});
	});

	it('displays loaded pools', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText('Family')).toBeInTheDocument();
			expect(screen.getByText('Friends')).toBeInTheDocument();
		});
	});

	it('displays pool descriptions', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText('Family gift exchange')).toBeInTheDocument();
			expect(screen.getByText('Friends group')).toBeInTheDocument();
		});
	});

	it('displays member counts', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText(/5 members/i)).toBeInTheDocument();
			expect(screen.getByText(/3 members/i)).toBeInTheDocument();
		});
	});

	it('handles singular member count', async () => {
		const singleMemberPool = [{ id: 1, name: 'Solo', description: 'One person', member_count: 1 }];
		(api.apiGet as jest.Mock).mockResolvedValue(singleMemberPool);

		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText(/1 member/i)).toBeInTheDocument();
			expect(screen.queryByText(/1 members/i)).not.toBeInTheDocument();
		});
	});

	it('updates pool name input', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Pool Name')).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText('Pool Name') as HTMLInputElement;
		fireEvent.change(nameInput, { target: { value: 'New Pool' } });

		expect(nameInput.value).toBe('New Pool');
	});

	it('updates description input', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
		});

		const descInput = screen.getByLabelText(/Description/i) as HTMLInputElement;
		fireEvent.change(descInput, { target: { value: 'Test description' } });

		expect(descInput.value).toBe('Test description');
	});

	it('creates a new pool successfully', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText('Create Pool')).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText('Pool Name');
		const descInput = screen.getByLabelText(/Description/i);
		const createButton = screen.getByText('Create Pool');

		fireEvent.change(nameInput, { target: { value: 'Work Team' } });
		fireEvent.change(descInput, { target: { value: 'Office pool' } });
		fireEvent.click(createButton);

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith('/api/pools', {
				name: 'Work Team',
				description: 'Office pool',
			});
		});
	});

	it('shows alert when pool name is missing', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText('Create Pool')).toBeInTheDocument();
		});

		const createButton = screen.getByText('Create Pool');
		fireEvent.click(createButton);

		expect(global.alert).toHaveBeenCalledWith('Please enter a pool name');
	});

	it('clears form after successful creation', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText('Create Pool')).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText('Pool Name') as HTMLInputElement;
		const descInput = screen.getByLabelText(/Description/i) as HTMLInputElement;
		const createButton = screen.getByText('Create Pool');

		fireEvent.change(nameInput, { target: { value: 'Test Pool' } });
		fireEvent.change(descInput, { target: { value: 'Test desc' } });
		fireEvent.click(createButton);

		await waitFor(() => {
			expect(nameInput.value).toBe('');
			expect(descInput.value).toBe('');
		});
	});

	it('deletes a pool when confirmed', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText('Family')).toBeInTheDocument();
		});

		const deleteButtons = screen.getAllByText('Delete');
		fireEvent.click(deleteButtons[0]);

		expect(global.confirm).toHaveBeenCalledWith('Delete this pool? All people must be removed from it first.');

		await waitFor(() => {
			expect(api.apiDelete).toHaveBeenCalledWith('/api/pools/1');
		});
	});

	it('does not delete when user cancels', async () => {
		(global.confirm as jest.Mock).mockReturnValue(false);

		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText('Family')).toBeInTheDocument();
		});

		const deleteButtons = screen.getAllByText('Delete');
		fireEvent.click(deleteButtons[0]);

		expect(api.apiDelete).not.toHaveBeenCalled();
	});

	it('shows loading state', async () => {
		(api.apiGet as jest.Mock).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(mockPools), 100)));

		render(<PoolsTab />);

		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it('shows empty state when no pools exist', async () => {
		(api.apiGet as jest.Mock).mockResolvedValue([]);

		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText('No pools yet')).toBeInTheDocument();
		});
	});

	it('handles API error on create', async () => {
		(api.apiPost as jest.Mock).mockRejectedValue(new Error('API Error'));

		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText('Create Pool')).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText('Pool Name');
		const createButton = screen.getByText('Create Pool');

		fireEvent.change(nameInput, { target: { value: 'Error Pool' } });
		fireEvent.click(createButton);

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith('API Error');
		});
	});

	it('handles API error on delete', async () => {
		(api.apiDelete as jest.Mock).mockRejectedValue(new Error('Delete Error'));

		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText('Family')).toBeInTheDocument();
		});

		const deleteButtons = screen.getAllByText('Delete');
		fireEvent.click(deleteButtons[0]);

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith('Delete Error');
		});
	});

	it('creates pool with empty description', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText('Create Pool')).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText('Pool Name');
		const createButton = screen.getByText('Create Pool');

		fireEvent.change(nameInput, { target: { value: 'Simple Pool' } });
		fireEvent.click(createButton);

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith('/api/pools', {
				name: 'Simple Pool',
				description: '',
			});
		});
	});

	it('displays pool with zero members', async () => {
		const emptyPool = [{ id: 1, name: 'Empty', description: 'No members', member_count: 0 }];
		(api.apiGet as jest.Mock).mockResolvedValue(emptyPool);

		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText(/0 members/i)).toBeInTheDocument();
		});
	});

	it('renders form in grid layout', async () => {
		const { container } = render(<PoolsTab />);

		await waitFor(() => {
			const grid = container.querySelector('.grid');
			expect(grid).toBeInTheDocument();
		});
	});

	it('applies correct styling to create button', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			const createButton = screen.getByText('Create Pool');
			expect(createButton).toHaveClass('bg-indigo-600', 'text-white', 'hover:bg-indigo-700');
		});
	});

	it('reloads pools after successful creation', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText('Create Pool')).toBeInTheDocument();
		});

		const initialCalls = (api.apiGet as jest.Mock).mock.calls.length;

		const nameInput = screen.getByLabelText('Pool Name');
		const createButton = screen.getByText('Create Pool');

		fireEvent.change(nameInput, { target: { value: 'New Pool' } });
		fireEvent.click(createButton);

		await waitFor(() => {
			expect((api.apiGet as jest.Mock).mock.calls.length).toBeGreaterThan(initialCalls);
		});
	});

	it('reloads pools after successful deletion', async () => {
		render(<PoolsTab />);

		await waitFor(() => {
			expect(screen.getByText('Family')).toBeInTheDocument();
		});

		const initialCalls = (api.apiGet as jest.Mock).mock.calls.length;

		const deleteButtons = screen.getAllByText('Delete');
		fireEvent.click(deleteButtons[0]);

		await waitFor(() => {
			expect((api.apiGet as jest.Mock).mock.calls.length).toBeGreaterThan(initialCalls);
		});
	});
});
