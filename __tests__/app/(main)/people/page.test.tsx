import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page from '@/app/(main)/people/page';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('People Management Page', () => {
	const mockPools = [
		{ id: 1, name: 'Family' },
		{ id: 2, name: 'Friends' },
	];
	const mockPeople = [
		{ id: 101, name: 'Alice', email: 'alice@example.com', pool_id: 1, pool_name: 'Family' },
		{ id: 102, name: 'Bob', email: 'bob@example.com', pool_id: 1, pool_name: 'Family' },
		{ id: 103, name: 'Charlie', email: 'charlie@example.com', pool_id: 2, pool_name: 'Friends' },
	];

	beforeEach(() => {
		jest.clearAllMocks();
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url.includes('/api/pools')) {
				return Promise.resolve(mockPools);
			}
			if (url.includes('/api/people')) {
				return Promise.resolve(mockPeople);
			}
			return Promise.resolve([]);
		});
		(api.apiPost as jest.Mock).mockResolvedValue({});
		(api.apiDelete as jest.Mock).mockResolvedValue({});
		global.alert = jest.fn();
		global.confirm = jest.fn(() => true);
	});

	it('renders the people management page', async () => {
		render(<Page />);

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/people');
		});

		expect(screen.getByText('Manage People')).toBeInTheDocument();
		expect(screen.getByLabelText('Name')).toBeInTheDocument();
		expect(screen.getByLabelText('Email')).toBeInTheDocument();
		expect(screen.getByLabelText('Pool')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Add Person/i })).toBeInTheDocument();
		expect(screen.getByText('Current People')).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText('Alice')).toBeInTheDocument();
			expect(screen.getByText('Bob')).toBeInTheDocument();
			expect(screen.getByText('Charlie')).toBeInTheDocument();
		});
	});

	it('loads pools and people on mount', async () => {
		render(<Page />);
		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/pools');
			expect(api.apiGet).toHaveBeenCalledWith('/api/people');
		});
	});

	it('adds a new person', async () => {
		render(<Page />);

		await waitFor(() => {
			fireEvent.change(screen.getByLabelText('Pool'), { target: { value: '1' } });
		});

		fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'David' } });
		fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'david@example.com' } });
		fireEvent.click(screen.getByRole('button', { name: /Add Person/i }));

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith('/api/people', {
				name: 'David',
				email: 'david@example.com',
				pool_id: 1,
			});
			expect(api.apiGet).toHaveBeenCalledTimes(3); // 2 initial loads + 1 reload after add
		});
	});

	it('removes a person', async () => {
		render(<Page />);

		await waitFor(() => {
			expect(screen.getByText('Alice')).toBeInTheDocument();
		});

		fireEvent.click(screen.getAllByRole('button', { name: /Delete/i })[0]); // Click delete for Alice

		await waitFor(() => {
			expect(global.confirm).toHaveBeenCalledWith('Delete this person?');
			expect(api.apiDelete).toHaveBeenCalledWith('/api/people/101');
			expect(api.apiGet).toHaveBeenCalledTimes(3); // 2 initial loads + 1 reload after delete
		});
	});

	it('filters people by pool', async () => {
		render(<Page />);

		await waitFor(() => {
			expect(screen.getByText('Alice')).toBeInTheDocument();
			expect(screen.getByText('Charlie')).toBeInTheDocument();
		});

		fireEvent.change(screen.getByRole('combobox', { name: 'All Pools' }), { target: { value: '2' } }); // Filter by Friends pool

		expect(screen.queryByText('Alice')).not.toBeInTheDocument();
		expect(screen.getByText('Charlie')).toBeInTheDocument();
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
			expect(screen.getByText((content) => content.includes('Please create a pool first'))).toBeInTheDocument();
		});
	});

	it('validates email format', async () => {
		render(<Page />);

		await waitFor(() => {
			fireEvent.change(screen.getByLabelText('Pool'), { target: { value: '1' } });
		});

		fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Invalid Email User' } });
		fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid-email' } });
		fireEvent.click(screen.getByRole('button', { name: /Add Person/i }));

		await waitFor(() => {
			expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
			expect(api.apiPost).not.toHaveBeenCalled();
		});
	});
});