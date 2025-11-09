import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page from '@/app/(main)/generate/page';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('Generate Assignments Page', () => {
	const mockPools = [
		{ id: 1, name: 'Family', member_count: 3 },
		{ id: 2, name: 'Friends', member_count: 5 },
	];

	const mockAssignments = [
		{ giver_name: 'Alice', receiver_name: 'Bob', pool_name: 'Family' },
		{ giver_name: 'Bob', receiver_name: 'Charlie', pool_name: 'Family' },
		{ giver_name: 'Charlie', receiver_name: 'Alice', pool_name: 'Family' },
	];

	beforeEach(() => {
		jest.clearAllMocks();

		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url.startsWith('/api/pools')) return Promise.resolve(mockPools);
			if (url.startsWith('/api/assignments')) return Promise.resolve(mockAssignments);
			return Promise.resolve([]);
		});

		(api.apiPost as jest.Mock).mockResolvedValue({
			success: true,
			message: 'Assignments generated successfully'
		});

		(api.apiDelete as jest.Mock).mockResolvedValue({});

		global.confirm = jest.fn(() => true);
		global.alert = jest.fn();
	});

	it('renders the generate assignments page', async () => {
		render(<Page />);

		await screen.findByText('Generate Assignments');
		expect(screen.getByLabelText('Pool')).toBeInTheDocument();
		expect(screen.getByLabelText('Year')).toBeInTheDocument();
		expect(screen.getByText(/Family \(3 people\)/i)).toBeInTheDocument();
	});

	it('loads pools on mount', async () => {
		render(<Page />);
		await waitFor(() => expect(api.apiGet).toHaveBeenCalled());
	});

	it('generates assignments when button is clicked', async () => {
		render(<Page />);

		fireEvent.change(screen.getByLabelText('Pool'), { target: { value: '1' } });
		fireEvent.click(screen.getByRole('button', { name: /Generate/i }));

		await screen.findByText(/Assignments generated successfully/i);
	});

	it('deletes assignments when button is clicked', async () => {
		render(<Page />);

		fireEvent.change(screen.getByLabelText('Pool'), { target: { value: '1' } });
		fireEvent.click(screen.getByRole('button', { name: /Generate/i }));
		await screen.findByText(/Assignments generated successfully/i);

		await screen.findByText((text) =>
			text.includes('Alice') && text.includes('Bob')
		);

		fireEvent.click(screen.getByRole('button', { name: /Delete All/i }));

		await waitFor(() => {
			expect(global.confirm).toHaveBeenCalled();
			expect(api.apiDelete).toHaveBeenCalled();
			expect(screen.getByText(/Assignments deleted successfully/i)).toBeInTheDocument();
		});
	});

	it('sends notifications when button is clicked', async () => {
		render(<Page />);

		fireEvent.change(screen.getByLabelText('Pool'), { target: { value: '1' } });
		fireEvent.click(screen.getByRole('button', { name: /Generate/i }));
		await screen.findByText(/Assignments generated successfully/i);

		await screen.findByText((text) => text.includes('Alice') && text.includes('Bob'));

		fireEvent.click(screen.getByRole('button', { name: /Send Email Notifications/i }));

		expect(global.confirm).toHaveBeenCalledWith('Send email notifications to all participants?');

		expect(api.apiPost).toHaveBeenCalledWith(
			`/api/send-notifications/${new Date().getFullYear()}?pool_id=1`
		);
	});

	it('shows warning if pool has less than 2 members', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url.startsWith('/api/pools')) {
				return Promise.resolve([{ id: 1, name: 'Small Pool', member_count: 1 }]);
			}
			return Promise.resolve([]);
		});

		render(<Page />);

		await screen.findByText(/Small Pool \(1 people\)/i);
		expect(screen.getByText(/at least 2 people/)).toBeInTheDocument();
	});
});
