import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '@/app/(auth)/login/login-page';
import HomePage from '@/app/(main)/home/page';
import ChangePasswordPage from '@/app/(main)/change-password/page';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as api from '@/lib/api';

jest.mock('next-auth/react');
jest.mock('next/navigation');
jest.mock('@/lib/api');

describe('Page Components', () => {
	const mockPush = jest.fn();
	const mockRefresh = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		(useRouter as jest.Mock).mockReturnValue({
			push: mockPush,
			refresh: mockRefresh,
		});
	});

	describe('LoginPage', () => {
		beforeEach(() => {
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

	describe('HomePage', () => {
		it('shows loading when no session', () => {
			(useSession as jest.Mock).mockReturnValue({ data: null });

			render(<HomePage />);

			expect(screen.getByText('Loading...')).toBeInTheDocument();
		});

		it('renders admin tabs for admin users', () => {
			(useSession as jest.Mock).mockReturnValue({
				data: {
					user: { id: '1', role: 'admin' },
				},
			});

			render(<HomePage />);

			expect(screen.getByText('🏊 Pools')).toBeInTheDocument();
			expect(screen.getByText('👥 People')).toBeInTheDocument();
			expect(screen.getByText('🔐 Users')).toBeInTheDocument();
			expect(screen.getByText('🎁 Wishlists')).toBeInTheDocument();
			expect(screen.getByText('🚫 Restrictions')).toBeInTheDocument();
			expect(screen.getByText('✨ Generate')).toBeInTheDocument();
			expect(screen.getByText('📊 History')).toBeInTheDocument();
			expect(screen.getByText('📧 Email Config')).toBeInTheDocument();
		});

		it('renders user tabs for regular users', () => {
			(useSession as jest.Mock).mockReturnValue({
				data: {
					user: { id: '2', role: 'user' },
				},
			});

			render(<HomePage />);

			expect(screen.getByText('🎁 My Wishlist')).toBeInTheDocument();
			expect(screen.getByText('Their Wishlist')).toBeInTheDocument();

			// Should not show admin tabs
			expect(screen.queryByText('🏊 Pools')).not.toBeInTheDocument();
			expect(screen.queryByText('👥 People')).not.toBeInTheDocument();
		});
	});

	describe('ChangePasswordPage', () => {
		beforeEach(() => {
			(useSession as jest.Mock).mockReturnValue({
				data: {
					user: { id: '5', mustChangePassword: false },
				},
			});
		});

		it('renders change password form', () => {
			render(<ChangePasswordPage />);

			expect(screen.getByText('🔒 Change Password')).toBeInTheDocument();
			expect(screen.getByLabelText('Current Password')).toBeInTheDocument();
			expect(screen.getByLabelText('New Password')).toBeInTheDocument();
			expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
		});

		it('shows required message when mustChangePassword is true', () => {
			(useSession as jest.Mock).mockReturnValue({
				data: {
					user: { id: '5', mustChangePassword: true },
				},
			});

			render(<ChangePasswordPage />);

			expect(screen.getByText('⚠️ Change Password Required')).toBeInTheDocument();
			expect(screen.getByText(/You must change your temporary password/i)).toBeInTheDocument();
		});

		it('validates password length', async () => {
			render(<ChangePasswordPage />);

			const currentPassword = screen.getByLabelText('Current Password');
			const newPassword = screen.getByLabelText('New Password');
			const confirmPassword = screen.getByLabelText('Confirm New Password');
			const submitButton = screen.getByRole('button', { name: /Change Password/i });

			fireEvent.change(currentPassword, { target: { value: 'oldpass' } });
			fireEvent.change(newPassword, { target: { value: 'short' } });
			fireEvent.change(confirmPassword, { target: { value: 'short' } });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
			});
		});

		it('validates passwords match', async () => {
			render(<ChangePasswordPage />);

			const currentPassword = screen.getByLabelText('Current Password');
			const newPassword = screen.getByLabelText('New Password');
			const confirmPassword = screen.getByLabelText('Confirm New Password');
			const submitButton = screen.getByRole('button', { name: /Change Password/i });

			fireEvent.change(currentPassword, { target: { value: 'oldpass123' } });
			fireEvent.change(newPassword, { target: { value: 'newpass123' } });
			fireEvent.change(confirmPassword, { target: { value: 'different123' } });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('New passwords do not match')).toBeInTheDocument();
			});
		});

		it('successfully changes password', async () => {
			(api.apiPost as jest.Mock).mockResolvedValue({ success: true });
			global.alert = jest.fn();

			render(<ChangePasswordPage />);

			const currentPassword = screen.getByLabelText('Current Password');
			const newPassword = screen.getByLabelText('New Password');
			const confirmPassword = screen.getByLabelText('Confirm New Password');
			const submitButton = screen.getByRole('button', { name: /Change Password/i });

			fireEvent.change(currentPassword, { target: { value: 'oldpass123' } });
			fireEvent.change(newPassword, { target: { value: 'newpass123' } });
			fireEvent.change(confirmPassword, { target: { value: 'newpass123' } });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(api.apiPost).toHaveBeenCalledWith('/api/change-password', {
					currentPassword: 'oldpass123',
					newPassword: 'newpass123',
				});
				expect(global.alert).toHaveBeenCalledWith('Password changed successfully!');
				expect(mockPush).toHaveBeenCalledWith('/');
			});
		});

		it('displays error on password change failure', async () => {
			(api.apiPost as jest.Mock).mockRejectedValue(new Error('Current password is incorrect'));

			render(<ChangePasswordPage />);

			const currentPassword = screen.getByLabelText('Current Password');
			const newPassword = screen.getByLabelText('New Password');
			const confirmPassword = screen.getByLabelText('Confirm New Password');
			const submitButton = screen.getByRole('button', { name: /Change Password/i });

			fireEvent.change(currentPassword, { target: { value: 'wrongpass' } });
			fireEvent.change(newPassword, { target: { value: 'newpass123' } });
			fireEvent.change(confirmPassword, { target: { value: 'newpass123' } });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
			});
		});

		it('shows cancel button when not required to change', () => {
			render(<ChangePasswordPage />);

			expect(screen.getByText('Cancel')).toBeInTheDocument();
		});

		it('hides cancel button when password change required', () => {
			(useSession as jest.Mock).mockReturnValue({
				data: {
					user: { id: '5', mustChangePassword: true },
				},
			});

			render(<ChangePasswordPage />);

			expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
		});

		it('handles cancel click', () => {
			render(<ChangePasswordPage />);

			const cancelButton = screen.getByText('Cancel');
			fireEvent.click(cancelButton);

			expect(mockPush).toHaveBeenCalledWith('/');
		});

		it('shows loading state during password change', async () => {
			(api.apiPost as jest.Mock).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)));

			render(<ChangePasswordPage />);

			const currentPassword = screen.getByLabelText('Current Password');
			const newPassword = screen.getByLabelText('New Password');
			const confirmPassword = screen.getByLabelText('Confirm New Password');
			const submitButton = screen.getByRole('button', { name: /Change Password/i });

			fireEvent.change(currentPassword, { target: { value: 'oldpass123' } });
			fireEvent.change(newPassword, { target: { value: 'newpass123' } });
			fireEvent.change(confirmPassword, { target: { value: 'newpass123' } });
			fireEvent.click(submitButton);

			await waitFor(() => {
				expect(screen.getByText('Changing Password...')).toBeInTheDocument();
			});
		});
	});
});
