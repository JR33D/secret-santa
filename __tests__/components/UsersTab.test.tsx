import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UsersTab from '@/components/UsersTab';

jest.mock('@/lib/api', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiDelete: jest.fn(),
}));

const { apiGet, apiPost, apiDelete } = require('@/lib/api');

describe('UsersTab component', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // default: no users, one person available
    (apiGet as jest.Mock).mockImplementation((path: string) => {
      if (path === '/api/users') return Promise.resolve([]);
      if (path === '/api/people') return Promise.resolve([{ id: 1, name: 'Alice', email: 'alice@example.com' }]);
      return Promise.resolve([]);
    });
  });

  it('Create User button is disabled when no person is selected', async () => {
    render(<UsersTab />);

    // Wait for initial loads
    await waitFor(() => expect(apiGet).toHaveBeenCalledWith('/api/users'));

    const createBtn = screen.getByRole('button', { name: /Create User/i });
    expect(createBtn).toBeDisabled();
  });

  it('creates a user and shows credentials modal when email sent', async () => {
    // /api/users -> [], /api/people -> people list
    (apiGet as jest.Mock).mockImplementation((path: string) => {
      if (path === '/api/users') return Promise.resolve([]);
      if (path === '/api/people') return Promise.resolve([{ id: 1, name: 'Alice', email: 'alice@example.com' }]);
      return Promise.resolve([]);
    });

    (apiPost as jest.Mock).mockResolvedValueOnce({
      username: 'alice',
      tempPassword: 'temppass',
      person_name: 'Alice',
      person_email: 'alice@example.com',
      emailSent: true,
    });

    render(<UsersTab />);

    // Wait for loads
    await waitFor(() => expect(apiGet).toHaveBeenCalledWith('/api/people'));

    // select the person
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: '1' } });

  const createBtn = screen.getByRole('button', { name: /Create User/i });
    fireEvent.click(createBtn);

    // apiPost should have been called
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/api/users', { person_id: 1 }));

    // Modal shows success text for email sent and temporary password
    expect(await screen.findByText(/Credentials Sent!/i)).toBeInTheDocument();
    expect(screen.getByText(/temppass/)).toBeInTheDocument();
  });

  it('resend credentials shows email error modal when send fails', async () => {
    // initial users list contains one non-admin user with email
    (apiGet as jest.Mock).mockImplementation((path: string) => {
      if (path === '/api/users')
        return Promise.resolve([
          { id: 3, username: 'bob', role: 'user', person_id: 2, person_name: 'Bob', person_email: 'bob@example.com', must_change_password: 0, created_at: new Date().toISOString() },
        ]);
      if (path === '/api/people') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    (apiPost as jest.Mock).mockResolvedValueOnce({
      username: 'bob',
      tempPassword: 'newpass',
      person_name: 'Bob',
      person_email: 'bob@example.com',
      emailSent: false,
      emailError: 'SMTP error',
    });

    const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<UsersTab />);

    // Wait for users to load
    await waitFor(() => expect(apiGet).toHaveBeenCalledWith('/api/users'));

    const resendBtn = await screen.findByText(/📧 Resend/);
    fireEvent.click(resendBtn);

    await waitFor(() => expect(apiPost).toHaveBeenCalled());

    // Expect modal that indicates email failed
    expect(await screen.findByText(/Email could not be sent/i)).toBeInTheDocument();
    expect(screen.getByText(/SMTP error/)).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

  it('deletes a user when confirmed and calls apiDelete', async () => {
    (apiGet as jest.Mock).mockImplementation((path: string) => {
      if (path === '/api/users')
        return Promise.resolve([
          { id: 4, username: 'carol', role: 'user', person_id: 3, person_name: 'Carol', person_email: 'carol@example.com', must_change_password: 0, created_at: new Date().toISOString() },
        ]);
      if (path === '/api/people') return Promise.resolve([]);
      return Promise.resolve([]);
    });

    (apiDelete as jest.Mock).mockResolvedValueOnce({});

    const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<UsersTab />);

    await waitFor(() => expect(apiGet).toHaveBeenCalledWith('/api/users'));

    const deleteBtn = await screen.findByText(/Delete/);
    fireEvent.click(deleteBtn);

    await waitFor(() => expect(apiDelete).toHaveBeenCalledWith('/api/users/4'));

    confirmSpy.mockRestore();
  });
});
