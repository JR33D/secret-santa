import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyWishlistTab from '@/components/MyWishlistTab';
import { useSession } from 'next-auth/react';
import * as api from '@/lib/api';

jest.mock('next-auth/react');
jest.mock('@/lib/api');

describe('MyWishlistTab Component', () => {
  const mockSession = {
    user: { id: '5', role: 'user', personId: 10 },
  };

  const mockItems = [
    {
      id: 1,
      item_name: 'Book',
      link: 'https://example.com/book',
      image_url: 'https://example.com/book.jpg',
    },
    {
      id: 2,
      item_name: 'Gadget',
      link: null,
      image_url: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useSession as jest.Mock).mockReturnValue({ data: mockSession });
    (api.apiGet as jest.Mock).mockResolvedValue(mockItems);
    (api.apiPost as jest.Mock).mockResolvedValue({ success: true });
    (api.apiDelete as jest.Mock).mockResolvedValue({ success: true });
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
  });

  it('renders the component with title', async () => {
    render(<MyWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText('🎁 My Wishlist')).toBeInTheDocument();
    });
  });

  it('displays description text', async () => {
    render(<MyWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText(/Your Secret Santa will see this list/i)).toBeInTheDocument();
    });
  });

  it('loads wishlist items on mount', async () => {
    render(<MyWishlistTab />);

    await waitFor(() => {
      expect(api.apiGet).toHaveBeenCalledWith('/api/wishlist/10');
      expect(screen.getByText('Book')).toBeInTheDocument();
      expect(screen.getByText('Gadget')).toBeInTheDocument();
    });
  });

  it('shows warning when user has no person linked', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '5', role: 'user', personId: null } },
    });

    render(<MyWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText(/Your account is not linked to a person/i)).toBeInTheDocument();
    });
  });

  it('adds a new item successfully', async () => {
    render(<MyWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText('Book')).toBeInTheDocument();
    });

    const itemInput = screen.getByPlaceholderText('Item name *');
    const linkInput = screen.getByPlaceholderText('Link (optional)');
    const imageInput = screen.getByPlaceholderText('Image URL (optional)');
    const addButton = screen.getByText('Add to Wishlist');

    fireEvent.change(itemInput, { target: { value: 'New Item' } });
    fireEvent.change(linkInput, { target: { value: 'https://example.com/new' } });
    fireEvent.change(imageInput, { target: { value: 'https://example.com/new.jpg' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith('/api/wishlist/10', {
        item_name: 'New Item',
        link: 'https://example.com/new',
        image_url: 'https://example.com/new.jpg',
      });
    });
  });

  it('shows alert when item name is missing', async () => {
    render(<MyWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText('Add to Wishlist')).toBeInTheDocument();
    });

    const addButton = screen.getByText('Add to Wishlist');
    fireEvent.click(addButton);

    expect(global.alert).toHaveBeenCalledWith('Please provide an item name');
  });

  it('clears form after successful add', async () => {
    render(<MyWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText('Book')).toBeInTheDocument();
    });

    const itemInput = screen.getByPlaceholderText('Item name *') as HTMLInputElement;
    const linkInput = screen.getByPlaceholderText('Link (optional)') as HTMLInputElement;
    const imageInput = screen.getByPlaceholderText('Image URL (optional)') as HTMLInputElement;
    const addButton = screen.getByText('Add to Wishlist');

    fireEvent.change(itemInput, { target: { value: 'Test Item' } });
    fireEvent.change(linkInput, { target: { value: 'https://test.com' } });
    fireEvent.change(imageInput, { target: { value: 'https://test.jpg' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(itemInput.value).toBe('');
      expect(linkInput.value).toBe('');
      expect(imageInput.value).toBe('');
    });
  });

  it('removes an item when confirmed', async () => {
    render(<MyWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText('Book')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    expect(global.confirm).toHaveBeenCalledWith('Remove this item from your wishlist?');

    await waitFor(() => {
      expect(api.apiDelete).toHaveBeenCalledWith('/api/wishlist/item/1');
    });
  });

  it('does not remove when user cancels', async () => {
    (global.confirm as jest.Mock).mockReturnValue(false);

    render(<MyWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText('Book')).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    expect(api.apiDelete).not.toHaveBeenCalled();
  });

  it('displays item links', async () => {
    render(<MyWishlistTab />);

    await waitFor(() => {
      const link = screen.getByText('🔗 View Link');
      expect(link).toHaveAttribute('href', 'https://example.com/book');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  it('displays item images', async () => {
    render(<MyWishlistTab />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      const bookImage = images.find(img => 
        img.getAttribute('src') === 'https://example.com/book.jpg'
      );
      expect(bookImage).toBeInTheDocument();
    });
  });

  it('shows empty state when no items', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([]);

    render(<MyWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
      expect(screen.getByText(/Add some items above to get started/i)).toBeInTheDocument();
    });
  });

  it('shows loading state', async () => {
    (api.apiGet as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockItems), 100))
    );

    render(<MyWishlistTab />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Book')).toBeInTheDocument();
    });
  });

  it('handles add error gracefully', async () => {
    (api.apiPost as jest.Mock).mockRejectedValue(new Error('Add failed'));

    render(<MyWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText('Book')).toBeInTheDocument();
    });

    const itemInput = screen.getByPlaceholderText('Item name *');
    const addButton = screen.getByText('Add to Wishlist');

    fireEvent.change(itemInput, { target: { value: 'Error Item' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Add failed');
    });
  });

  it('handles image load errors', async () => {
    render(<MyWishlistTab />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      const bookImage = images.find(img => 
        img.getAttribute('src') === 'https://example.com/book.jpg'
      ) as HTMLImageElement;
      
      if (bookImage) {
        fireEvent.error(bookImage);
        expect(bookImage.style.display).toBe('none');
      }
    });
  });

  it('reloads items after adding', async () => {
    render(<MyWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText('Book')).toBeInTheDocument();
    });

    const initialCalls = (api.apiGet as jest.Mock).mock.calls.length;

    const itemInput = screen.getByPlaceholderText('Item name *');
    const addButton = screen.getByText('Add to Wishlist');

    fireEvent.change(itemInput, { target: { value: 'New Item' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect((api.apiGet as jest.Mock).mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  it('reloads items after removing', async () => {
    render(<MyWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText('Book')).toBeInTheDocument();
    });

    const initialCalls = (api.apiGet as jest.Mock).mock.calls.length;

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect((api.apiGet as jest.Mock).mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });
});