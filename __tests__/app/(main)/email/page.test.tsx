import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page from '@/app/(main)/email/page';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('Email Configuration Page', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		(api.apiGet as jest.Mock).mockResolvedValue({
			smtp_server: 'smtp.example.com',
			smtp_port: 587,
			smtp_username: 'user@example.com',
			from_email: 'from@example.com',
		});
	});

	it('renders the email configuration page', async () => {
		render(<Page />);

		expect(screen.getByText('Email Configuration')).toBeInTheDocument();
		expect(screen.getByLabelText('SMTP Server')).toBeInTheDocument();
		expect(screen.getByLabelText('SMTP Port')).toBeInTheDocument();
		expect(screen.getByLabelText('Username')).toBeInTheDocument();
		expect(screen.getByLabelText('Password')).toBeInTheDocument();
		expect(screen.getByLabelText('From Email')).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByDisplayValue('smtp.example.com')).toBeInTheDocument();
			expect(screen.getByDisplayValue('587')).toBeInTheDocument();
			expect(screen.getByDisplayValue('user@example.com')).toBeInTheDocument();
			expect(screen.getByDisplayValue('from@example.com')).toBeInTheDocument();
		});
	});

	it('loads existing configuration on mount', async () => {
		render(<Page />);

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/email-config');
		});
	});
});
