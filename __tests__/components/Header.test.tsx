import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '@/components/Header';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

jest.mock('next-auth/react');
jest.mock('next/navigation');

describe('Header Component', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (signOut as jest.Mock).mockResolvedValue({});
  });

  it('renders basic header when not logged in', () => {
    (useSession as jest.Mock).mockReturnValue({ data: null });

    render(<Header />);

    expect(screen.getByText('🎅 Family Secret Santa')).toBeInTheDocument();
    expect(screen.getByText(/Organize your family's gift exchange/i)).toBeInTheDocument();
  });

  it('does not show user info when not logged in', () => {
    (useSession as jest.Mock).mockReturnValue({ data: null });

    render(<Header />);

    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
    expect(screen.queryByText('Change Password')).not.toBeInTheDocument();
  });

  it('renders user info when logged in', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'John Doe', username: 'johndoe', role: 'user' },
      },
    });

    render(<Header />);

    expect(screen.getByText('👤 User')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays admin badge for admin users', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'Admin User', username: 'admin', role: 'admin' },
      },
    });

    render(<Header />);

    expect(screen.getByText('👑 Admin')).toBeInTheDocument();
    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  it('displays username when name not available', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { username: 'johndoe', role: 'user' },
      },
    });

    render(<Header />);

    expect(screen.getByText('johndoe')).toBeInTheDocument();
  });

  it('handles logout click', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'John Doe', username: 'johndoe', role: 'user' },
      },
    });

    render(<Header />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledWith({ redirect: false });
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('handles change password click', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'John Doe', username: 'johndoe', role: 'user' },
      },
    });

    render(<Header />);

    const changePasswordButton = screen.getByText('Change Password');
    fireEvent.click(changePasswordButton);

    expect(mockPush).toHaveBeenCalledWith('/change-password');
  });

  it('renders logout and change password buttons', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'John Doe', username: 'johndoe', role: 'user' },
      },
    });

    render(<Header />);

    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('applies correct styling to buttons', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'John Doe', username: 'johndoe', role: 'user' },
      },
    });

    render(<Header />);

    const logoutButton = screen.getByText('Logout');
    const changePasswordButton = screen.getByText('Change Password');

    expect(logoutButton).toHaveClass('bg-red-600');
    expect(changePasswordButton).toHaveClass('bg-gray-200');
  });

  it('renders header with border separator when logged in', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: {
        user: { name: 'John Doe', username: 'johndoe', role: 'user' },
      },
    });

    const { container } = render(<Header />);

    const separator = container.querySelector('.border-b-2');
    expect(separator).toBeInTheDocument();
  });
});