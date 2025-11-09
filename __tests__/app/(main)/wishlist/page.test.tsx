import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page from '@/app/(main)/wishlist/page';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('Manage Wishlists Page', () => {
	const mockPeople = [
		{ id: 101, name: 'Alice' },
		{ id: 102, name: 'Bob' },
	];
	const mockWishlistItems = [
		{ id: 1, item_name: 'Book', link: 'http://book.com' },
		{ id: 2, item_name: 'Gadget', link: '' },
	];

	beforeEach(() => {
		jest.clearAllMocks();
		let currentWishlistItems = [...mockWishlistItems]; // Use a mutable copy

		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url.includes('/api/people')) {
				return Promise.resolve(mockPeople);
			}
			if (url.includes('/api/wishlist/101')) {
				return Promise.resolve(currentWishlistItems); // Return current state
			}
			if (url.includes('/api/wishlist/102')) {
				return Promise.resolve([]);
			}
			return Promise.resolve([]);
		});
		(api.apiPost as jest.Mock).mockImplementation((url: string, data: any) => {
			if (url.includes('/api/wishlist/101')) {
				const newItem = { id: Date.now(), item_name: data.item_name, link: data.link, image_url: data.image_url };
				currentWishlistItems.push(newItem); // Add new item to mutable list
			}
			return Promise.resolve({});
		});
		(api.apiDelete as jest.Mock).mockImplementation((url: string) => {
			const itemId = Number(url.split('/').pop());
			currentWishlistItems = currentWishlistItems.filter((item) => item.id !== itemId); // Remove item from mutable list
			return Promise.resolve({});
		});
		global.alert = jest.fn();
	});

	it('renders the manage wishlists page', async () => {
		render(<Page />);

		expect(screen.getByText('Manage Wishlists')).toBeInTheDocument();
		expect(screen.getByLabelText('Select Person')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('Item name')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Add Item/i })).toBeInTheDocument();
		expect(screen.getByText('Wishlist Items')).toBeInTheDocument();

		await waitFor(() => {
			expect(screen.getByText('Alice')).toBeInTheDocument();
			expect(screen.getByText('Bob')).toBeInTheDocument();
		});
	});

	it('loads people on mount', async () => {
		render(<Page />);
		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/people');
		});
	});

	it('loads wishlist items when a person is selected', async () => {
		render(<Page />);

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/people');
		});

		fireEvent.change(screen.getByLabelText('Select Person'), { target: { value: '101' } }); // Alice

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/wishlist/101');
			expect(screen.getByText('Book')).toBeInTheDocument();
			expect(screen.getByText('Gadget')).toBeInTheDocument();
		});
	});

	it('adds a new item to the selected person\'s wishlist', async () => {
		render(<Page />);

		await waitFor(() => {
			fireEvent.change(screen.getByLabelText('Select Person'), { target: { value: '101' } }); // Alice
		});

		await act(async () => {
			fireEvent.change(screen.getByPlaceholderText('Item name'), { target: { value: 'New Toy' } });
		});
		await act(async () => {
			fireEvent.change(screen.getByPlaceholderText('Link (optional)'), { target: { value: 'http://toy.com' } });
		});
		await act(async () => {
			fireEvent.change(screen.getByPlaceholderText('Image URL (optional)'), { target: { value: 'http://newitem.com/image.jpg' } });
		});
		await act(async () => {
			fireEvent.click(screen.getByRole('button', { name: /Add Item/i }));
		});

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith('/api/wishlist/101', {
				item_name: 'New Toy',
				link: 'http://toy.com',
				image_url: 'http://newitem.com/image.jpg',
			});
			expect(api.apiGet).toHaveBeenCalledTimes(3); // Initial people + initial wishlist + reload after add
		});
	});

	it('removes an item from the selected person\'s wishlist', async () => {
		render(<Page />);

		await waitFor(() => {
			fireEvent.change(screen.getByLabelText('Select Person'), { target: { value: '101' } }); // Alice
		});

		await waitFor(() => {
			expect(screen.getByText('Book')).toBeInTheDocument();
		});

		await act(async () => {
			fireEvent.click(screen.getAllByRole('button', { name: /Remove/i })[0]); // Click remove for 'Book'
		});

		await waitFor(() => {
			expect(global.confirm).toHaveBeenCalledWith('Remove this item from your wishlist?');
			expect(api.apiDelete).toHaveBeenCalledWith('/api/wishlist/item/1');
			expect(screen.queryByText('Book')).not.toBeInTheDocument(); // Assert that 'Book' is no longer in the document
			expect(api.apiGet).toHaveBeenCalledTimes(3); // Initial people + initial wishlist + reload after delete
		});
	});

	it('shows empty items message when no items for selected person', async () => {
		render(<Page />);

		await waitFor(() => {
			fireEvent.change(screen.getByLabelText('Select Person'), { target: { value: '102' } }); // Bob (has no items)
		});

		await waitFor(() => {
			expect(screen.getByText('No items yet')).toBeInTheDocument();
		});
	});
});
