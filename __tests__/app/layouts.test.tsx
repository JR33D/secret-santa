import React from 'react';
import { render, screen } from '@testing-library/react';

// Lightweight mocks for layout dependencies
jest.mock('@/components/SessionProvider', () => ({
  SessionProvider: ({ children }: any) => <div data-testid="session">{children}</div>,
}));

jest.mock('@/components/Header', () => ({ __esModule: true, default: () => <div data-testid="header">Header</div> }));

describe('App layouts smoke tests', () => {
  it('renders root layout and children', () => {
    const RootLayout = require('@/app/layout').default;
    render(
      // @ts-ignore
      <RootLayout>
        <div>root-child</div>
      </RootLayout>
    );

    expect(screen.getByText('root-child')).toBeInTheDocument();
  });

  it('renders auth layout and children', () => {
    const AuthLayout = require('@/app/(auth)/layout').default;
    render(
      // @ts-ignore
      <AuthLayout>
        <div>auth-child</div>
      </AuthLayout>
    );

    expect(screen.getByText('auth-child')).toBeInTheDocument();
  });

  it('renders main layout, uses SessionProvider and Header, and renders children', () => {
    const MainLayout = require('@/app/(main)/layout').default;
    render(
      // @ts-ignore
      <MainLayout>
        <div>main-child</div>
      </MainLayout>
    );

    expect(screen.getByText('main-child')).toBeInTheDocument();
    expect(screen.getByTestId('session')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });
});
