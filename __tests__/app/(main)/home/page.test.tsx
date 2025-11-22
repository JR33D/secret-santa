import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '@/app/(main)/home/page';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

jest.mock('next-auth/react');

// Mock next/navigation's useRouter and useSearchParams globally
jest.mock('next/navigation', () => ({
	...jest.requireActual('next/navigation'), // Keep other exports
	redirect: jest.fn(), // Mock redirect as well
	useRouter: jest.fn(),
	useSearchParams: jest.fn(),
}));

describe('HomePage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		// Clear calls from previous tests for the globally mocked redirect
		(redirect as jest.Mock).mockClear();
	});

	it('redirects to /pools for admin users', () => {
		(useSession as jest.Mock).mockReturnValue({
			data: {
				user: { id: '1', role: 'admin' },
			},
			status: 'authenticated',
		});

		try {
			render(<HomePage />);
		} catch (e: unknown) {
			// Next.js redirect throws an error to stop rendering
			if (e instanceof Error) {
				expect(e.message).toContain('NEXT_REDIRECT');
			} else {
				fail('Expected an error to be thrown');
			}
		}

		expect(redirect as jest.Mock).toHaveBeenCalledWith('/pools');
	});

	it('redirects to /my-wishlist for regular users', () => {
		(useSession as jest.Mock).mockReturnValue({
			data: {
				user: { id: '2', role: 'user' },
			},
			status: 'authenticated',
		});

		try {
			render(<HomePage />);
		} catch (e: unknown) {
			// Next.js redirect throws an error to stop rendering
			if (e instanceof Error) {
				expect(e.message).toContain('NEXT_REDIRECT');
			} else {
				fail('Expected an error to be thrown');
			}
		}

		expect(redirect as jest.Mock).toHaveBeenCalledWith('/my-wishlist');
	});

	it('shows loading when session status is loading', () => {
		(useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading' });

		render(<HomePage />);

		expect(screen.getByText('Loading...')).toBeInTheDocument();
		expect(redirect as jest.Mock).not.toHaveBeenCalled();
	});

	it('renders null when session status is unauthenticated', () => {
		(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });

		const { container } = render(<HomePage />);

		expect(container).toBeEmptyDOMElement();
		expect(redirect as jest.Mock).not.toHaveBeenCalled();
	});
});
