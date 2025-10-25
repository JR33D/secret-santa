import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmailTab from '@/components/EmailTab';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('EmailTab Component', () => {
	const mockEmailConfig = {
		smtp_server: 'smtp.example.com',
		smtp_port: 587,
		smtp_username: 'user@example.com',
		from_email: 'noreply@example.com',
	};

	beforeEach(() => {
		jest.clearAllMocks();
		(api.apiGet as jest.Mock).mockResolvedValue(mockEmailConfig);
		(api.apiPost as jest.Mock).mockResolvedValue({ success: true });
		global.alert = jest.fn();
	});

	it('renders the component with title and message', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			expect(screen.getByText('Email Configuration')).toBeInTheDocument();
			expect(screen.getByText(/manages SMTP configuration via environment variables/i)).toBeInTheDocument();
		});
	});

	it('loads email configuration on mount', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/email-config');
		});
	});

	it('displays loaded email configuration', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			const smtpServerInput = screen.getByLabelText('SMTP Server') as HTMLInputElement;
			expect(smtpServerInput.value).toBe('smtp.example.com');
		});

		const smtpPortInput = screen.getByLabelText('SMTP Port') as HTMLInputElement;
		const usernameInput = screen.getByLabelText('Username') as HTMLInputElement;
		const fromEmailInput = screen.getByLabelText('From Email') as HTMLInputElement;

		expect(smtpPortInput.value).toBe('587');
		expect(usernameInput.value).toBe('user@example.com');
		expect(fromEmailInput.value).toBe('noreply@example.com');
	});

	it('renders inputs as read-only (changes do not apply)', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			const smtpServerInput = screen.getByLabelText('SMTP Server') as HTMLInputElement;
			expect(smtpServerInput).toHaveAttribute('readonly');
		});

		const smtpServerInput = screen.getByLabelText('SMTP Server') as HTMLInputElement;
		fireEvent.change(smtpServerInput, { target: { value: 'smtp.newserver.com' } });

		// Value should remain unchanged because field is read-only
		expect(smtpServerInput.value).toBe('smtp.example.com');
	});

	// inputs are read-only now; no tests for changing values

	it('does not render a save button', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			expect(screen.queryByText('Save Configuration')).toBeNull();
		});
	});

	it('handles empty configuration on load', async () => {
		(api.apiGet as jest.Mock).mockResolvedValue({});

		render(<EmailTab />);

		await waitFor(() => {
			const smtpServerInput = screen.getByLabelText('SMTP Server') as HTMLInputElement;
			expect(smtpServerInput.value).toBe('');
		});

		const smtpPortInput = screen.getByLabelText('SMTP Port') as HTMLInputElement;
		expect(smtpPortInput.value).toBe('587');
	});

	it('displays all form fields in grid layout', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('SMTP Server')).toBeInTheDocument();
			expect(screen.getByLabelText('SMTP Port')).toBeInTheDocument();
			expect(screen.getByLabelText('Username')).toBeInTheDocument();
			expect(screen.getByLabelText('Password')).toBeInTheDocument();
			expect(screen.getByLabelText('From Email')).toBeInTheDocument();
		});
	});

	it('renders password field as password type', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			const passwordInput = screen.getByLabelText('Password');
			expect(passwordInput).toHaveAttribute('type', 'password');
		});
	});

	it('renders port field as number type', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			const portInput = screen.getByLabelText('SMTP Port');
			expect(portInput).toHaveAttribute('type', 'number');
		});
	});

	// Save button removed in env-only mode

	// No save button; API POST tests not applicable in env-only mode

	it('does not display password value from loaded config', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
			expect(passwordInput.value).toBe('');
		});
	});
});
