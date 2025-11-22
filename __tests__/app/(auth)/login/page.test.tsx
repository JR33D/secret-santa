import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '@/app/(auth)/login/login-page';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

jest.mock('next-auth/react');
jest.mock('next/navigation');
jest.mock('@/lib/api');

describe('LoginPage', () => {
	const mockPush = jest.fn();
	const mockRefresh = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		(useRouter as jest.Mock).mockReturnValue({
			push: mockPush,
			refresh: mockRefresh,
		});
		(useSearchParams as jest.Mock).mockReturnValue({
			get: jest.fn(() => null),
		});
	});

	it('renders login form', () => {
		render(<LoginPage />);

		expect(screen.getByText('Secret Santa')).toBeInTheDocument();
		expect(screen.getByText('Sign in to continue')).toBeInTheDocument();
		expect(screen.getByLabelText('Username')).toBeInTheDocument();
		expect(screen.getByLabelText('Password')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
	});

	it('handles successful login', async () => {
		(signIn as jest.Mock).mockResolvedValue({ error: null });

		render(<LoginPage />);

		const usernameInput = screen.getByLabelText('Username');
		const passwordInput = screen.getByLabelText('Password');
		const submitButton = screen.getByRole('button', { name: /sign in/i });

		fireEvent.change(usernameInput, { target: { value: 'testuser' } });
		fireEvent.change(passwordInput, { target: { value: 'password123' } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(signIn).toHaveBeenCalledWith('credentials', {
				username: 'testuser',
				password: 'password123',
				redirect: false,
			});
			expect(mockPush).toHaveBeenCalledWith('/home');
			expect(mockRefresh).toHaveBeenCalled();
		});
	});

	it('displays error on failed login', async () => {
		(signIn as jest.Mock).mockResolvedValue({ error: 'Invalid credentials' });

		render(<LoginPage />);

		const usernameInput = screen.getByLabelText('Username');
		const passwordInput = screen.getByLabelText('Password');
		const submitButton = screen.getByRole('button', { name: /sign in/i });

		fireEvent.change(usernameInput, { target: { value: 'wronguser' } });
		fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
		});
	});

	it('redirects to callback URL after login', async () => {
		(useSearchParams as jest.Mock).mockReturnValue({
			get: jest.fn(() => '/admin'),
		});
		(signIn as jest.Mock).mockResolvedValue({ error: null });

		render(<LoginPage />);

		const usernameInput = screen.getByLabelText('Username');
		const passwordInput = screen.getByLabelText('Password');
		const submitButton = screen.getByRole('button', { name: /sign in/i });

		fireEvent.change(usernameInput, { target: { value: 'testuser' } });
		fireEvent.change(passwordInput, { target: { value: 'password123' } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith('/admin');
		});
	});

	it('shows loading state during login', async () => {
		(signIn as jest.Mock).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100)));

		render(<LoginPage />);

		const usernameInput = screen.getByLabelText('Username');
		const passwordInput = screen.getByLabelText('Password');
		const submitButton = screen.getByRole('button', { name: /sign in/i });

		fireEvent.change(usernameInput, { target: { value: 'testuser' } });
		fireEvent.change(passwordInput, { target: { value: 'password123' } });
		fireEvent.click(submitButton);

		// Check that loading state appears
		expect(screen.getByText('Signing in...')).toBeInTheDocument();

		// Wait for the promise to resolve and loading to disappear
		await waitFor(
			() => {
				expect(mockPush).toHaveBeenCalledWith('/home');
			},
			{ timeout: 3000 },
		);
	});

	it('handles unexpected errors', async () => {
		(signIn as jest.Mock).mockRejectedValue(new Error('Network error'));

		render(<LoginPage />);

		const usernameInput = screen.getByLabelText('Username');
		const passwordInput = screen.getByLabelText('Password');
		const submitButton = screen.getByRole('button', { name: /sign in/i });

		fireEvent.change(usernameInput, { target: { value: 'testuser' } });
		fireEvent.change(passwordInput, { target: { value: 'password123' } });
		fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText('An error occurred. Please try again.')).toBeInTheDocument();
		});
	});
});
