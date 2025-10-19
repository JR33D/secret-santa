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

	it('renders the component with title', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			expect(screen.getByText('Email Configuration')).toBeInTheDocument();
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

	it('updates SMTP server input', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('SMTP Server')).toBeInTheDocument();
		});

		const smtpServerInput = screen.getByLabelText('SMTP Server') as HTMLInputElement;
		fireEvent.change(smtpServerInput, { target: { value: 'smtp.newserver.com' } });

		expect(smtpServerInput.value).toBe('smtp.newserver.com');
	});

	it('updates SMTP port input', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('SMTP Port')).toBeInTheDocument();
		});

		const smtpPortInput = screen.getByLabelText('SMTP Port') as HTMLInputElement;
		fireEvent.change(smtpPortInput, { target: { value: '465' } });

		expect(smtpPortInput.value).toBe('465');
	});

	it('updates username input', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Username')).toBeInTheDocument();
		});

		const usernameInput = screen.getByLabelText('Username') as HTMLInputElement;
		fireEvent.change(usernameInput, { target: { value: 'newuser@example.com' } });

		expect(usernameInput.value).toBe('newuser@example.com');
	});

	it('updates password input', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Password')).toBeInTheDocument();
		});

		const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
		fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });

		expect(passwordInput.value).toBe('newpassword123');
		expect(passwordInput.type).toBe('password');
	});

	it('updates from email input', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('From Email')).toBeInTheDocument();
		});

		const fromEmailInput = screen.getByLabelText('From Email') as HTMLInputElement;
		fireEvent.change(fromEmailInput, { target: { value: 'santa@example.com' } });

		expect(fromEmailInput.value).toBe('santa@example.com');
	});

	it('saves configuration successfully', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			expect(screen.getByText('Save Configuration')).toBeInTheDocument();
		});

		const smtpServerInput = screen.getByLabelText('SMTP Server');
		const smtpPortInput = screen.getByLabelText('SMTP Port');
		const usernameInput = screen.getByLabelText('Username');
		const passwordInput = screen.getByLabelText('Password');
		const fromEmailInput = screen.getByLabelText('From Email');
		const saveButton = screen.getByText('Save Configuration');

		fireEvent.change(smtpServerInput, { target: { value: 'smtp.test.com' } });
		fireEvent.change(smtpPortInput, { target: { value: '465' } });
		fireEvent.change(usernameInput, { target: { value: 'test@example.com' } });
		fireEvent.change(passwordInput, { target: { value: 'testpass' } });
		fireEvent.change(fromEmailInput, { target: { value: 'from@example.com' } });

		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith('/api/email-config', {
				smtp_server: 'smtp.test.com',
				smtp_port: 465,
				smtp_username: 'test@example.com',
				smtp_password: 'testpass',
				from_email: 'from@example.com',
			});
		});

		expect(global.alert).toHaveBeenCalledWith('Email configuration saved!');
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

	it('applies correct styling to save button', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			const saveButton = screen.getByText('Save Configuration');
			expect(saveButton).toHaveClass('bg-indigo-600', 'text-white', 'hover:bg-indigo-700');
		});
	});

	it('handles API error gracefully', async () => {
		(api.apiPost as jest.Mock).mockRejectedValue(new Error('API Error'));

		render(<EmailTab />);

		await waitFor(() => {
			expect(screen.getByText('Save Configuration')).toBeInTheDocument();
		});

		const saveButton = screen.getByText('Save Configuration');
		fireEvent.click(saveButton);

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalled();
		});
	});

	it('does not display password value from loaded config', async () => {
		render(<EmailTab />);

		await waitFor(() => {
			const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;
			expect(passwordInput.value).toBe('');
		});
	});
});
