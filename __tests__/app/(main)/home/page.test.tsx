import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HomePage from '@/app/(main)/home/page';
import { useSession } from 'next-auth/react';

jest.mock('next-auth/react');

const mockRedirect = jest.fn();

jest.mock('next/navigation', () => ({
	...jest.requireActual('next/navigation'),
	redirect: (...args: unknown[]) => {
		mockRedirect(...args);
		throw new Error('NEXT_REDIRECT');
	},
	useRouter: jest.fn(),
	useSearchParams: jest.fn(),
}));

describe('HomePage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockRedirect.mockClear();
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
			if (e instanceof Error) {
				expect(e.message).toContain('NEXT_REDIRECT');
			} else {
				fail('Expected an error to be thrown');
			}
		}

		expect(mockRedirect).toHaveBeenCalledWith('/pools');
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
			if (e instanceof Error) {
				expect(e.message).toContain('NEXT_REDIRECT');
			} else {
				fail('Expected an error to be thrown');
			}
		}

		expect(mockRedirect).toHaveBeenCalledWith('/my-wishlist');
	});

	it('shows loading when session status is loading', () => {
		(useSession as jest.Mock).mockReturnValue({ data: null, status: 'loading' });

		render(<HomePage />);

		expect(screen.getByText('Loading...')).toBeInTheDocument();
		expect(mockRedirect).not.toHaveBeenCalled();
	});

	it('renders null when session status is unauthenticated', () => {
		(useSession as jest.Mock).mockReturnValue({ data: null, status: 'unauthenticated' });

		const { container } = render(<HomePage />);

		expect(container).toBeEmptyDOMElement();
		expect(mockRedirect).not.toHaveBeenCalled();
	});
});
