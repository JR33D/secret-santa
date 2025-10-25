import React from 'react';
import { render } from '@testing-library/react';
// Mock next-auth's SessionProvider so tests don't depend on library internals
jest.mock('next-auth/react', () => ({
	SessionProvider: ({ children }: any) => <div>{children}</div>,
}));
import { SessionProvider } from '@/components/SessionProvider';

describe('SessionProvider', () => {
	it('renders children', () => {
		const { getByText } = render(
			<SessionProvider>
				<div>hello world</div>
			</SessionProvider>,
		);

		expect(getByText('hello world')).toBeTruthy();
	});
});
