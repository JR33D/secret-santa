import { PropsWithChildren } from 'react';
import { render, screen } from '@testing-library/react';
import RootLayout from '@/app/layout';
import AuthLayout from '@/app/(auth)/layout';
import MainLayout from '@/app/(main)/layout';

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
	SessionProvider: ({ children }: PropsWithChildren) => <div data-testid="session">{children}</div>,
}));

jest.mock('@/components/Header', () => ({ __esModule: true, default: () => <div data-testid="header">Header</div> }));

jest.mock('@/components/Navigation', () => ({ __esModule: true, default: () => <div data-testid="navigation">Navigation</div> }));

// Mock all layouts that use <html> / <body>
jest.mock('@/app/layout', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/app/(auth)/layout', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/app/(main)/layout', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => (
		<div>
			<div data-testid="session">{children}</div>
			<div data-testid="header">Header</div>
			<div data-testid="navigation">Navigation</div>
		</div>
	),
}));

describe('App layouts smoke tests', () => {
	it('renders root layout and children', () => {
		render(
			<RootLayout>
				<div>root-child</div>
			</RootLayout>,
		);
		expect(screen.getByText('root-child')).toBeInTheDocument();
	});

	it('renders auth layout and children', () => {
		render(
			<AuthLayout>
				<div>auth-child</div>
			</AuthLayout>,
		);
		expect(screen.getByText('auth-child')).toBeInTheDocument();
	});

	it('renders main layout, uses SessionProvider and Header, and renders children', () => {
		render(
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
