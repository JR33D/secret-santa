import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page from '@/app/(main)/my-wishlist/page';
import { useSession } from 'next-auth/react';
import * as api from '@/lib/api';

jest.mock('next-auth/react');
jest.mock('@/lib/api');

describe('My Wishlist Page', () => {
	const mockSession = {
		data: {
			user: { id: '1', name: 'Test User', email: 'test@example.com', personId: 101 },
		},
		status: 'authenticated',
	};

	const mockWishlistItems = [
		{ id: 1, item_name: 'Book', link: 'http://book.com', image_url: 'http://book.com/image.jpg' },
		{ id: 2, item_name: 'Gadget', link: '', image_url: '' },
	];

	beforeEach(() => {
		jest.clearAllMocks();
		(useSession as jest.Mock).mockReturnValue(mockSession);
		(api.apiGet as jest.Mock).mockResolvedValue(mockWishlistItems);
		(api.apiPost as jest.Mock).mockResolvedValue({});
		(api.apiDelete as jest.Mock).mockResolvedValue({});
		global.alert = jest.fn();
		global.confirm = jest.fn(() => true);
	});

	it('renders the my wishlist page', async () => {
		render(<Page />);

		expect(screen.getByText('🎁 My Wishlist')).toBeInTheDocument();
		expect(screen.getByText('Add New Item')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('Item name *')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Add to Wishlist/i })).toBeInTheDocument();
		expect(screen.getByText('Your Wishlist Items')).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText('Book')).toBeInTheDocument();
			expect(screen.getByText('Gadget')).toBeInTheDocument();
		});
	});

	it('loads wishlist items on mount if personId is available', async () => {
		render(<Page />);
		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/wishlist/101');
		});
	});

	it('does not load items if personId is not available', () => {
		(useSession as jest.Mock).mockReturnValue({
			data: { user: { id: '1', name: 'Test User', email: 'test@example.com' } }, // No personId
			status: 'authenticated',
		});
		render(<Page />);
		expect(api.apiGet).not.toHaveBeenCalled();
		expect(screen.getByText('Your account is not linked to a person. Please contact an administrator.')).toBeInTheDocument();
	});

	it('adds a new item to the wishlist', async () => {
		render(<Page />);

		fireEvent.change(screen.getByPlaceholderText('Item name *'), { target: { value: 'New Item' } });
		fireEvent.change(screen.getByPlaceholderText('Link (optional)'), { target: { value: 'http://newitem.com' } });
		fireEvent.change(screen.getByPlaceholderText('Image URL (optional)'), { target: { value: 'http://newitem.com/image.jpg' } });
		fireEvent.click(screen.getByRole('button', { name: /Add to Wishlist/i }));

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith('/api/wishlist/101', {
				item_name: 'New Item',
				link: 'http://newitem.com',
				image_url: 'http://newitem.com/image.jpg',
			});
			expect(api.apiGet).toHaveBeenCalledTimes(2); // Initial load + reload after add
		});
	});

	it('removes an item from the wishlist', async () => {
		render(<Page />);

		await waitFor(() => {
			expect(screen.getByText('Book')).toBeInTheDocument();
		});

		fireEvent.click(screen.getAllByRole('button', { name: /Remove/i })[0]); // Click remove for 'Book'

		await waitFor(() => {
			expect(global.confirm).toHaveBeenCalledWith('Remove this item from your wishlist?');
			expect(api.apiDelete).toHaveBeenCalledWith('/api/wishlist/item/1');
			expect(api.apiGet).toHaveBeenCalledTimes(2); // Initial load + reload after delete
		});
	});

	it('shows empty wishlist message when no items', async () => {
		(api.apiGet as jest.Mock).mockResolvedValue([]); // No items
		render(<Page />);

		await waitFor(() => {
			expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument();
		});
	});

	it('shows loading state', () => {
		(api.apiGet as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolve
		render(<Page />);
		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});
});
