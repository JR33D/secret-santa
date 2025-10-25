import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PeopleTab from '@/components/PeopleTab';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('PeopleTab Component', () => {
	const mockPools = [
		{ id: 1, name: 'Family', description: 'Family pool' },
		{ id: 2, name: 'Friends', description: 'Friends pool' },
	];

	const mockPeople = [
		{ id: 1, name: 'John Doe', email: 'john@example.com', pool_id: 1, pool_name: 'Family' },
		{ id: 2, name: 'Jane Smith', email: 'jane@example.com', pool_id: 2, pool_name: 'Friends' },
	];

	beforeEach(() => {
		jest.clearAllMocks();
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve(mockPools);
			if (url === '/api/people') return Promise.resolve(mockPeople);
			return Promise.resolve([]);
		});
		(api.apiPost as jest.Mock).mockResolvedValue({ success: true });
		(api.apiDelete as jest.Mock).mockResolvedValue({ success: true });
		global.alert = jest.fn();
		global.confirm = jest.fn(() => true);
	});

	it('renders the component with title', async () => {
		render(<PeopleTab />);

		await waitFor(() => {
			expect(screen.getByText('Manage People')).toBeInTheDocument();
		});
	});

	it('loads and displays pools and people on mount', async () => {
		render(<PeopleTab />);

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/pools');
			expect(api.apiGet).toHaveBeenCalledWith('/api/people');
		});

		await waitFor(() => {
			expect(screen.getByText('John Doe')).toBeInTheDocument();
			expect(screen.getByText('jane@example.com')).toBeInTheDocument();
		});
	});

	it('shows warning when no pools exist', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve([]);
			if (url === '/api/people') return Promise.resolve([]);
			return Promise.resolve([]);
		});

		render(<PeopleTab />);

		await waitFor(() => {
			expect(screen.getByText(/Please create a pool first/i)).toBeInTheDocument();
		});
	});

	it('adds a new person successfully', async () => {
		render(<PeopleTab />);

		await waitFor(() => {
			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText('Name');
		const emailInput = screen.getByLabelText('Email');
		const poolSelect = screen.getByLabelText('Pool');
		const addButton = screen.getByText('Add Person');

		fireEvent.change(nameInput, { target: { value: 'New Person' } });
		fireEvent.change(emailInput, { target: { value: 'new@example.com' } });
		fireEvent.change(poolSelect, { target: { value: '1' } });
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith('/api/people', {
				name: 'New Person',
				email: 'new@example.com',
				pool_id: 1,
			});
		});
	});

	it('button disabled when required fields are missing', async () => {
		render(<PeopleTab />);

		await waitFor(() => {
			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});

		const addButton = screen.getByText('Add Person');

		fireEvent.click(addButton);
		expect(global.alert).not.toHaveBeenCalledWith('Please fill in all fields');

		expect(addButton).not.toBeEnabled();
	});

	it('clears form after successful add', async () => {
		render(<PeopleTab />);

		await waitFor(() => {
			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
		const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
		const poolSelect = screen.getByLabelText('Pool');
		const addButton = screen.getByText('Add Person');

		fireEvent.change(nameInput, { target: { value: 'Test User' } });
		fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
		fireEvent.change(poolSelect, { target: { value: '1' } });
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(nameInput.value).toBe('');
			expect(emailInput.value).toBe('');
		});
	});

	it('deletes a person when confirmed', async () => {
		render(<PeopleTab />);

		await waitFor(() => {
			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});

		const deleteButtons = screen.getAllByText('Delete');
		fireEvent.click(deleteButtons[0]);

		expect(global.confirm).toHaveBeenCalledWith('Delete this person?');

		await waitFor(() => {
			expect(api.apiDelete).toHaveBeenCalledWith('/api/people/1');
		});
	});

	it('does not delete when user cancels confirmation', async () => {
		(global.confirm as jest.Mock).mockReturnValue(false);

		render(<PeopleTab />);

		await waitFor(() => {
			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});

		const deleteButtons = screen.getAllByText('Delete');
		fireEvent.click(deleteButtons[0]);

		expect(api.apiDelete).not.toHaveBeenCalled();
	});

	it('filters people by pool', async () => {
		render(<PeopleTab />);

		await waitFor(() => {
			expect(screen.getByText('John Doe')).toBeInTheDocument();
			expect(screen.getByText('Jane Smith')).toBeInTheDocument();
		});

		const filterSelect = screen.getAllByRole('combobox').find((select) => select.getAttribute('value') === 'all');

		if (filterSelect) {
			fireEvent.change(filterSelect, { target: { value: '1' } });

			await waitFor(() => {
				expect(screen.getByText('John Doe')).toBeInTheDocument();
				expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
			});
		}
	});

	it('displays pool name badge for each person', async () => {
		render(<PeopleTab />);

		await waitFor(() => {
			expect(screen.getByText('📁 Family')).toBeInTheDocument();
			expect(screen.getByText('📁 Friends')).toBeInTheDocument();
		});
	});

	it('shows loading state while fetching data', async () => {
		(api.apiGet as jest.Mock).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(mockPeople), 100)));

		render(<PeopleTab />);

		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it('shows empty state when no people exist', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve(mockPools);
			if (url === '/api/people') return Promise.resolve([]);
			return Promise.resolve([]);
		});

		render(<PeopleTab />);

		await waitFor(() => {
			expect(screen.getByText('No people yet')).toBeInTheDocument();
		});
	});

	it('handles API errors gracefully', async () => {
		(api.apiPost as jest.Mock).mockRejectedValue(new Error('API Error'));

		render(<PeopleTab />);

		await waitFor(() => {
			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});

		const nameInput = screen.getByLabelText('Name');
		const emailInput = screen.getByLabelText('Email');
		const poolSelect = screen.getByLabelText('Pool');
		const addButton = screen.getByText('Add Person');

		fireEvent.change(nameInput, { target: { value: 'Error User' } });
		fireEvent.change(emailInput, { target: { value: 'error@example.com' } });
		fireEvent.change(poolSelect, { target: { value: '1' } });
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(global.alert).toHaveBeenCalledWith('API Error');
		});
	});
});
