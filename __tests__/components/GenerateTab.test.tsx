import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GenerateTab from '@/components/GenerateTab';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('GenerateTab Component', () => {
	const mockPools = [
		{ id: 1, name: 'Family', member_count: 5 },
		{ id: 2, name: 'Friends', member_count: 1 },
	];

	const mockAssignments = [
		{ giver_name: 'John Doe', receiver_name: 'Jane Smith', pool_name: 'Family' },
		{ giver_name: 'Jane Smith', receiver_name: 'Bob Johnson', pool_name: 'Family' },
	];

	beforeEach(() => {
		jest.clearAllMocks();
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve(mockPools);
			if (url.includes('/api/assignments/') && url.includes('pool_id')) return Promise.resolve(mockAssignments);
			if (url === '/api/assignments') return Promise.resolve([...mockAssignments]);
			return Promise.resolve([]);
		});
		(api.apiPost as jest.Mock).mockResolvedValue({ success: true, message: 'Success!' });
		(api.apiDelete as jest.Mock).mockResolvedValue({ success: true });
		global.alert = jest.fn();
		global.confirm = jest.fn(() => true);
	});

	it('renders the component with title', async () => {
		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByText('Generate Assignments')).toBeInTheDocument();
		});
	});

	it('loads pools on mount', async () => {
		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/pools');
		});
	});

	it('shows warning when no pools exist', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve([]);
			return Promise.resolve([]);
		});

		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByText(/Please create a pool and add people first/i)).toBeInTheDocument();
		});
	});

	it('auto-selects first pool on load', async () => {
		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			const poolSelect = screen.getByLabelText('Pool') as HTMLSelectElement;
			expect(poolSelect.value).toBe('1');
		});
	});

	it('generates assignments successfully', async () => {
		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByText('🎲 Generate')).toBeInTheDocument();
		});

		const currentYear = new Date().getFullYear();
		const generateButton = screen.getByText('🎲 Generate');
		fireEvent.click(generateButton);

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith(`/api/generate/${currentYear}?pool_id=1`);
		});
	});

	it('displays success message after generation', async () => {
		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByText('🎲 Generate')).toBeInTheDocument();
		});

		const generateButton = screen.getByText('🎲 Generate');
		fireEvent.click(generateButton);

		await waitFor(() => {
			expect(screen.getByText('Success!')).toBeInTheDocument();
		});
	});

	it('displays error message on generation failure', async () => {
		(api.apiPost as jest.Mock).mockRejectedValue(new Error('Generation failed'));

		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByText('🎲 Generate')).toBeInTheDocument();
		});

		const generateButton = screen.getByText('🎲 Generate');
		fireEvent.click(generateButton);

		await waitFor(() => {
			expect(screen.getByText(/Error: Generation failed/i)).toBeInTheDocument();
		});
	});

	it('loads assignments after generation', async () => {
		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByText('🎲 Generate')).toBeInTheDocument();
		});

		const generateButton = screen.getByText('🎲 Generate');
		fireEvent.click(generateButton);

		await waitFor(() => {
			const strongJohn = screen.getByText((content, node) => node?.tagName === 'STRONG' && content.trim() === 'John Doe');
			const strongJane = screen.getAllByText((content, node) => node?.tagName === 'STRONG' && content.trim() === 'Jane Smith');
			expect(strongJohn).toBeInTheDocument();
			expect(strongJane[0]).toBeInTheDocument();
		});
	});

	it('deletes assignments when confirmed', async () => {
		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});

		const deleteButton = screen.getByText('Delete All');
		fireEvent.click(deleteButton);

		const currentYear = new Date().getFullYear();
		expect(global.confirm).toHaveBeenCalledWith(`Delete all ${currentYear} assignments for this pool?`);

		await waitFor(() => {
			expect(api.apiDelete).toHaveBeenCalledWith(`/api/assignments/${currentYear}?pool_id=1`);
		});
	});

	it('does not delete when user cancels', async () => {
		(global.confirm as jest.Mock).mockReturnValue(false);

		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});

		const deleteButton = screen.getByText('Delete All');
		fireEvent.click(deleteButton);

		expect(api.apiDelete).not.toHaveBeenCalled();
	});

	it('sends email notifications when confirmed', async () => {
		(api.apiPost as jest.Mock).mockImplementation((url: string) => {
			if (url.includes('/api/send-notifications/')) {
				return Promise.resolve([{ giver: 'John Doe', success: true, message: 'Email sent' }]);
			}
			return Promise.resolve({ success: true, message: 'Success!' });
		});

		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByText('John Doe')).toBeInTheDocument();
		});

		const emailButton = screen.getByText('📧 Send Email Notifications');
		fireEvent.click(emailButton);

		expect(global.confirm).toHaveBeenCalledWith('Send email notifications to all participants?');

		const currentYear = new Date().getFullYear();
		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith(`/api/send-notifications/${currentYear}?pool_id=1`);
		});
	});

	it('shows warning when pool has insufficient members', async () => {
		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByLabelText('Pool')).toBeInTheDocument();
		});

		const poolSelect = screen.getByLabelText('Pool');
		fireEvent.change(poolSelect, { target: { value: '2' } });

		await waitFor(() => {
			expect(screen.getByText(/This pool needs at least 2 people/i)).toBeInTheDocument();
		});
	});

	it('updates year input', async () => {
		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByLabelText('Year')).toBeInTheDocument();
		});

		const yearInput = screen.getByLabelText('Year') as HTMLInputElement;
		fireEvent.change(yearInput, { target: { value: '2024' } });

		expect(yearInput.value).toBe('2024');
	});

	it('shows empty state when no assignments exist', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve(mockPools);
			if (url.includes('/api/assignments/')) return Promise.resolve([]);
			if (url === '/api/assignments') return Promise.resolve([]);
			return Promise.resolve([]);
		});

		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByText(/No assignments yet for this pool and year/i)).toBeInTheDocument();
		});
	});

	it('displays total assignment count', async () => {
		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByText(/Total in system: 2/i)).toBeInTheDocument();
		});
	});

	it('disables generate button when no pool selected', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/pools') return Promise.resolve(mockPools);
			return Promise.resolve([]);
		});

		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByLabelText('Pool')).toBeInTheDocument();
		});

		const poolSelect = screen.getByLabelText('Pool');
		fireEvent.change(poolSelect, { target: { value: '' } });

		const generateButton = screen.getByText('🎲 Generate');
		expect(generateButton).toBeDisabled();
	});

	it('reloads assignments when pool or year changes', async () => {
		await act(async () => {
			render(<GenerateTab />);
		});

		await waitFor(() => {
			expect(screen.getByLabelText('Pool')).toBeInTheDocument();
		});

		const initialCalls = (api.apiGet as jest.Mock).mock.calls.length;

		const yearInput = screen.getByLabelText('Year');
		fireEvent.change(yearInput, { target: { value: '2024' } });

		await waitFor(() => {
			expect((api.apiGet as jest.Mock).mock.calls.length).toBeGreaterThan(initialCalls);
		});
	});
});
