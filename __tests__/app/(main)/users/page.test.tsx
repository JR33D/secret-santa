import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page from '@/app/(main)/users/page';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('User Management Page', () => {
	const mockPeople = [
		{ id: 101, name: 'Alice', email: 'alice@example.com' },
		{ id: 102, name: 'Bob', email: 'bob@example.com' },
	];
	const mockUsers = [
		{
			id: 1,
			username: 'alice_user',
			role: 'user',
			person_id: 101,
			person_name: 'Alice',
			person_email: 'alice@example.com',
			must_change_password: 0,
			created_at: '2023-01-01T00:00:00Z',
		},
		{
			id: 2,
			username: 'admin_user',
			role: 'admin',
			person_id: null,
			person_name: null,
			person_email: null,
			must_change_password: 0,
			created_at: '2023-01-01T00:00:00Z',
		},
	];

	beforeEach(() => {
		jest.clearAllMocks();
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url.includes('/api/users')) {
				return Promise.resolve(mockUsers);
			}
			if (url.includes('/api/people')) {
				return Promise.resolve(mockPeople);
			}
			return Promise.resolve([]);
		});
		(api.apiPost as jest.Mock).mockResolvedValue({
			username: 'new_user',
			tempPassword: 'temp_password',
			person_name: 'Bob',
			person_email: 'bob@example.com',
			emailSent: true,
		});
		(api.apiDelete as jest.Mock).mockResolvedValue({});
		global.alert = jest.fn();
		global.confirm = jest.fn(() => true);
	});

	it('renders the user management page', async () => {
		render(<Page />);

		expect(screen.getByText('User Management')).toBeInTheDocument();
		expect(screen.getByText('Create New User Account')).toBeInTheDocument();
		expect(screen.getByText('Existing Users')).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText('alice_user')).toBeInTheDocument();
			expect(screen.getByText('admin_user')).toBeInTheDocument();
		});
	});

	it('loads users and people on mount', async () => {
		render(<Page />);
		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/users');
			expect(api.apiGet).toHaveBeenCalledWith('/api/people');
		});
	});

	it('creates a new user', async () => {
		render(<Page />);

		await waitFor(() => {
			fireEvent.change(screen.getByRole('combobox'), { target: { value: '102' } }); // Bob
		});

		fireEvent.click(screen.getByRole('button', { name: /Create User/i }));

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith('/api/users', { person_id: 102 });
			expect(screen.getByRole('heading', { name: '✅ Credentials Sent!' })).toBeInTheDocument();
			expect(screen.getByText('new_user')).toBeInTheDocument();
			expect(screen.getByText('temp_password')).toBeInTheDocument();
		});
	});

	it('resends credentials for a user', async () => {
		render(<Page />);

		await waitFor(() => {
			expect(screen.getByText('alice_user')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByRole('button', { name: /Resend/i }));

		await waitFor(() => {
			expect(global.confirm).toHaveBeenCalledWith('Generate a new temporary password and send it via email?');
			            expect(screen.getByRole('heading', { name: '✅ Credentials Sent!' })).toBeInTheDocument();		});
	});

	it('deletes a user', async () => {
		render(<Page />);

		await waitFor(() => {
			expect(screen.getByText('alice_user')).toBeInTheDocument();
		});

		fireEvent.click(screen.getAllByRole('button', { name: /Delete/i })[0]); // Delete alice_user

		await waitFor(() => {
			expect(global.confirm).toHaveBeenCalledWith('Delete this user account?');
			expect(api.apiDelete).toHaveBeenCalledWith('/api/users/1');
			expect(api.apiGet).toHaveBeenCalledTimes(3); // 2 initial loads + 1 reload after delete
		});
	});

	it('filters out people who already have user accounts from the dropdown', async () => {
		render(<Page />);

		await waitFor(() => {
			expect(screen.queryByText('Alice (alice@example.com)')).not.toBeInTheDocument();
			expect(screen.getByText('Bob (bob@example.com)')).toBeInTheDocument();
		});
	});

	it('shows message when all people have user accounts', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url.includes('/api/users')) {
				return Promise.resolve([
					{
						id: 1,
						username: 'alice_user',
						role: 'user',
						person_id: 101,
						person_name: 'Alice',
						person_email: 'alice@example.com',
						must_change_password: 0,
						created_at: '2023-01-01T00:00:00Z',
					},
					{
						id: 3,
						username: 'bob_user',
						role: 'user',
						person_id: 102,
						person_name: 'Bob',
						person_email: 'bob@example.com',
						must_change_password: 0,
						created_at: '2023-01-01T00:00:00Z',
					},
				]);
			}
			if (url.includes('/api/people')) {
				return Promise.resolve(mockPeople);
			}
			return Promise.resolve([]);
		});

		render(<Page />);

		await waitFor(() => {
			expect(screen.getByText('All people already have user accounts, or no people exist yet.')).toBeInTheDocument();
		});
	});
});