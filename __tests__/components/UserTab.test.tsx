import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UsersTab from '@/components/UsersTab';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('UsersTab Component', () => {
  const mockUsers = [
    {
      id: 1,
      username: 'admin',
      role: 'admin',
      person_id: null,
      must_change_password: 0,
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      username: 'johndoe',
      role: 'user',
      person_id: 5,
      person_name: 'John Doe',
      person_email: 'john@example.com',
      must_change_password: 1,
      created_at: '2024-01-15T00:00:00Z',
    },
  ];

  const mockPeople = [
    { id: 10, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 11, name: 'Bob Johnson', email: 'bob@example.com' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (api.apiGet as jest.Mock).mockImplementation((url: string) => {
      if (url === '/api/users') return Promise.resolve(mockUsers);
      if (url === '/api/people') return Promise.resolve(mockPeople);
      return Promise.resolve([]);
    });
    (api.apiPost as jest.Mock).mockResolvedValue({
      username: 'janesmith',
      tempPassword: 'temp123',
      person_name: 'Jane Smith',
      person_email: 'jane@example.com',
      emailSent: true,
    });
    (api.apiDelete as jest.Mock).mockResolvedValue({ success: true });
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  it('renders the component with title', async () => {
    render(<UsersTab />);

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
  });

  it('loads users and people on mount', async () => {
    render(<UsersTab />);

    await waitFor(() => {
      expect(api.apiGet).toHaveBeenCalledWith('/api/users');
      expect(api.apiGet).toHaveBeenCalledWith('/api/people');
    });
  });
});