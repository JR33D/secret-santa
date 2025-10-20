import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReceiverWishlistTab from '@/components/ReceiverWishlistTab';
import { useSession } from 'next-auth/react';
import * as api from '@/lib/api';

jest.mock('next-auth/react');
jest.mock('@/lib/api');

describe('ReceiverWishlistTab Component', () => {
  const mockSession = {
    user: { id: '5', role: 'user', personId: 10 },
  };

  const mockAssignment = [
    {
      receiver_id: 15,
      receiver_name: 'Bob Smith',
      year: new Date().getFullYear(),
    },
  ];

  const mockWishlistItems = [
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
  });

  it('renders the component with title', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([]);

    render(<ReceiverWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText('🎅 Their Wishlist')).toBeInTheDocument();
    });
  });

  it('shows warning when user has no person linked', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { id: '5', role: 'user', personId: null } },
    });

    render(<ReceiverWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText(/Your account is not linked to a person/i)).toBeInTheDocument();
    });
  });

  it('loads assignment and wishlist on mount', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce(mockAssignment)
      .mockResolvedValueOnce(mockWishlistItems);

    render(<ReceiverWishlistTab />);

    const currentYear = new Date().getFullYear();
    await waitFor(() => {
      expect(api.apiGet).toHaveBeenCalledWith(`/api/my-assignment?person_id=10&year=${currentYear}`);
      expect(api.apiGet).toHaveBeenCalledWith('/api/wishlist/15');
    });
  });

  it('displays receiver name', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce(mockAssignment)
      .mockResolvedValueOnce(mockWishlistItems);

    render(<ReceiverWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText('🎁 Bob Smith 🎁')).toBeInTheDocument();
    });
  });

  it('displays wishlist items', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce(mockAssignment)
      .mockResolvedValueOnce(mockWishlistItems);

    render(<ReceiverWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText('🎁 Book')).toBeInTheDocument();
      expect(screen.getByText('🎁 Gadget')).toBeInTheDocument();
    });
  });

  it('displays item links', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce(mockAssignment)
      .mockResolvedValueOnce(mockWishlistItems);

    render(<ReceiverWishlistTab />);

    await waitFor(() => {
      const link = screen.getByText('🔗 View Link');
      expect(link).toHaveAttribute('href', 'https://example.com/book');
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  it('displays item images', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce(mockAssignment)
      .mockResolvedValueOnce(mockWishlistItems);

    render(<ReceiverWishlistTab />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      const bookImage = images.find(img => 
        img.getAttribute('src') === 'https://example.com/book.jpg'
      );
      expect(bookImage).toBeInTheDocument();
    });
  });

  it('shows message when receiver has no wishlist items', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce(mockAssignment)
      .mockResolvedValueOnce([]);

    render(<ReceiverWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText(/hasn't added any items to their wishlist yet/i)).toBeInTheDocument();
      expect(screen.getByText(/surprise them with something thoughtful/i)).toBeInTheDocument();
    });
  });

  it('shows message when no assignment exists', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([]);

    render(<ReceiverWishlistTab />);

    const currentYear = new Date().getFullYear();
    await waitFor(() => {
      expect(screen.getByText(`🎁 No assignment yet for ${currentYear}`)).toBeInTheDocument();
      expect(screen.getByText(/Once the Secret Santa assignments are generated/i)).toBeInTheDocument();
    });
  });

  it('shows loading state', async () => {
    (api.apiGet as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    render(<ReceiverWishlistTab />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('handles assignment load error gracefully', async () => {
    (api.apiGet as jest.Mock).mockRejectedValue(new Error('Load failed'));

    render(<ReceiverWishlistTab />);

    await waitFor(() => {
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(`🎁 No assignment yet for ${currentYear}`)).toBeInTheDocument();
    });
  });

  it('displays current year in header', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce(mockAssignment)
      .mockResolvedValueOnce(mockWishlistItems);

    render(<ReceiverWishlistTab />);

    const currentYear = new Date().getFullYear();
    await waitFor(() => {
      expect(screen.getByText(`Secret Santa ${currentYear}`)).toBeInTheDocument();
    });
  });

  it('displays receiver wishlist title', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce(mockAssignment)
      .mockResolvedValueOnce(mockWishlistItems);

    render(<ReceiverWishlistTab />);

    await waitFor(() => {
      expect(screen.getByText("Bob Smith's Wishlist")).toBeInTheDocument();
    });
  });

  it('handles image load errors', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce(mockAssignment)
      .mockResolvedValueOnce(mockWishlistItems);

    render(<ReceiverWishlistTab />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      const bookImage = images.find(img => 
        img.getAttribute('src') === 'https://example.com/book.jpg'
      ) as HTMLImageElement;
      
      if (bookImage) {
        const errorEvent = new Event('error');
        bookImage.dispatchEvent(errorEvent);
        expect(bookImage.style.display).toBe('none');
      }
    });
  });
});