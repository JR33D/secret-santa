import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
	usePathname: jest.fn(),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
	useSession: jest.fn(),
}));

// Lightweight mocks for layout dependencies
jest.mock('@/components/SessionProvider', () => ({
	SessionProvider: ({ children }: any) => <div data-testid="session">{children}</div>,
}));

jest.mock('@/components/Header', () => ({ __esModule: true, default: () => <div data-testid="header">Header</div> }));

// Mock the Navigation component
jest.mock('@/components/Navigation', () => ({ __esModule: true, default: () => <div data-testid="navigation">Navigation</div> }));

describe('App layouts smoke tests', () => {
	it('renders root layout and children', () => {
		const RootLayout = require('@/app/layout').default;
		render(
			// @ts-ignore
			<RootLayout>
				<div>root-child</div>
			</RootLayout>,
		);

		expect(screen.getByText('root-child')).toBeInTheDocument();
	});

	it('renders auth layout and children', () => {
		const AuthLayout = require('@/app/(auth)/layout').default;
		render(
			// @ts-ignore
			<AuthLayout>
				<div>auth-child</div>
			</AuthLayout>,
		);

		expect(screen.getByText('auth-child')).toBeInTheDocument();
	});

	it('renders main layout, uses SessionProvider and Header, and renders children', () => {
		// Mock the return value of usePathname and useSession for this specific test
		const { usePathname } = require('next/navigation');
		usePathname.mockReturnValue('/some-path');

		const { useSession } = require('next-auth/react');
		useSession.mockReturnValue({ data: { user: { role: 'admin' } }, status: 'authenticated' });

		const MainLayout = require('@/app/(main)/layout').default;
		render(
			// @ts-ignore
			<MainLayout>
				<div>main-child</div>
			</MainLayout>,
		);

		expect(screen.getByText('main-child')).toBeInTheDocument();
		expect(screen.getByTestId('session')).toBeInTheDocument();
		expect(screen.getByTestId('header')).toBeInTheDocument();
		expect(screen.getByTestId('navigation')).toBeInTheDocument();
	});
});
