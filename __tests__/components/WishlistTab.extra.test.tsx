import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WishlistTab from '@/components/WishlistTab';

jest.mock('@/lib/api', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiDelete: jest.fn(),
}));

import { apiGet, apiPost, apiDelete } from '@/lib/api';

describe('WishlistTab interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads people and allows adding an item', async () => {
    (apiGet as jest.Mock).mockImplementation(async (url: string) => {
      if (url === '/api/people') return [{ id: 1, name: 'Alice' }];
      if (url.startsWith('/api/wishlist/1')) return [];
      return [];
    });

    (apiPost as jest.Mock).mockResolvedValue({});

    render(<WishlistTab />);

    // Wait for person option to appear
    await waitFor(() => expect(apiGet).toHaveBeenCalledWith('/api/people'));

    const select = screen.getByLabelText(/Select Person/i) as HTMLSelectElement;
    // select option
    fireEvent.change(select, { target: { value: '1' } });

    // set item name and click add
    const itemInput = screen.getByPlaceholderText('Item name') as HTMLInputElement;
    fireEvent.change(itemInput, { target: { value: 'Toy Car' } });

    const addButton = screen.getByText(/Add Item/i);
    fireEvent.click(addButton);

    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/api/wishlist/1', { item_name: 'Toy Car', link: '', image_url: '' }));
  });

  it('shows items and allows removal', async () => {
    (apiGet as jest.Mock).mockImplementation(async (url: string) => {
      if (url === '/api/people') return [{ id: 1, name: 'Alice' }];
      if (url.startsWith('/api/wishlist/1')) return [{ id: 5, item_name: 'Book' }];
      return [];
    });

    (apiDelete as jest.Mock).mockResolvedValue({});

    render(<WishlistTab />);

    await waitFor(() => expect(apiGet).toHaveBeenCalledWith('/api/people'));

    const select = screen.getByLabelText(/Select Person/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '1' } });

    // Wait for item to appear
    const removeBtn = await screen.findByText(/Remove/i);
    fireEvent.click(removeBtn);

    await waitFor(() => expect(apiDelete).toHaveBeenCalledWith('/api/wishlist/item/5'));
  });
});
