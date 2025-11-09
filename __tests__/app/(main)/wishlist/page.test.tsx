import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
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

	let currentWishlistItems: typeof mockWishlistItems;

	beforeEach(() => {
		jest.clearAllMocks();
		currentWishlistItems = [...mockWishlistItems];

		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/people') return Promise.resolve(mockPeople);
			if (url.startsWith('/api/wishlist/')) {
				const id = url.split('/').pop();
				if (id === '101') return Promise.resolve(currentWishlistItems);
				if (id === '102') return Promise.resolve([]);
				return Promise.resolve([]);
			}
			return Promise.resolve([]);
		});

		(api.apiPost as jest.Mock).mockImplementation((url: string, data: any) => {
			if (url === '/api/wishlist/101') {
				const newItem = {
					id: Date.now(),
					item_name: data.item_name,
					link: data.link,
					image_url: data.image_url,
				};
				currentWishlistItems.push(newItem);
			}
			return Promise.resolve({});
		});

		(api.apiDelete as jest.Mock).mockImplementation((url: string) => {
			const id = Number(url.split('/').pop());
			currentWishlistItems = currentWishlistItems.filter((item) => item.id !== id);
			return Promise.resolve({});
		});

		global.alert = jest.fn();
		global.confirm = jest.fn(() => true);
	});

	const selectPerson = async (id: string) => {
		await screen.findByText('Alice'); // Wait for people to load
		await act(async () => {
			fireEvent.change(screen.getByLabelText('Select Person'), { target: { value: id } });
		});
	};

	it('renders the manage wishlists page', async () => {
		render(<Page />);
		expect(screen.getByText('Manage Wishlists')).toBeInTheDocument();
		expect(screen.getByLabelText('Select Person')).toBeInTheDocument();
		expect(screen.getByPlaceholderText('Item name')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /Add Item/i })).toBeInTheDocument();
		expect(screen.getByText('Wishlist Items')).toBeInTheDocument();
		await screen.findByText('Alice');
		await screen.findByText('Bob');
	});

	it('loads people on mount', async () => {
		render(<Page />);
		await waitFor(() => expect(api.apiGet).toHaveBeenCalledWith('/api/people'));
	});

	it('loads wishlist items when a person is selected', async () => {
		render(<Page />);
		await selectPerson('101');

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/wishlist/101');
			expect(screen.getByText('Book')).toBeInTheDocument();
			expect(screen.getByText('Gadget')).toBeInTheDocument();
		});
	});

	it("adds a new item to the selected person's wishlist", async () => {
		render(<Page />);
		await selectPerson('101');

		await act(async () => {
			fireEvent.change(screen.getByPlaceholderText('Item name'), { target: { value: 'New Toy' } });
			fireEvent.change(screen.getByPlaceholderText('Link (optional)'), { target: { value: 'http://toy.com' } });
			fireEvent.change(screen.getByPlaceholderText('Image URL (optional)'), { target: { value: 'http://newitem.com/image.jpg' } });
			fireEvent.click(screen.getByRole('button', { name: /Add Item/i }));
		});

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith('/api/wishlist/101', {
				item_name: 'New Toy',
				link: 'http://toy.com',
				image_url: 'http://newitem.com/image.jpg',
			});
			expect(screen.getByText('New Toy')).toBeInTheDocument();
		});
	});

	it("removes an item from the selected person's wishlist", async () => {
		render(<Page />);
		await selectPerson('101');

		await screen.findByText('Book'); // ensure items are rendered
		const removeButtons = await screen.findAllByRole('button', { name: /Remove/i });

		await act(async () => {
			fireEvent.click(removeButtons[0]);
		});

		await waitFor(() => {
			expect(api.apiDelete).toHaveBeenCalledWith('/api/wishlist/item/1');
			expect(screen.queryByText('Book')).not.toBeInTheDocument();
		});
	});

	it('shows empty items message when no items for selected person', async () => {
		render(<Page />);
		await selectPerson('102'); // Bob has no items
		await waitFor(() => expect(screen.getByText('No items yet')).toBeInTheDocument());
	});
});
