import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChangePasswordPage from '@/app/(main)/change-password/page';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';

jest.mock('next-auth/react');
jest.mock('next/navigation');
jest.mock('@/lib/api');

describe('ChangePasswordPage', () => {
	const mockPush = jest.fn();
	const mockRefresh = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		(useRouter as jest.Mock).mockReturnValue({
			push: mockPush,
			refresh: mockRefresh,
		});
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
