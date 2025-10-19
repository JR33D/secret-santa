import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WishlistTab from '@/components/WishlistTab';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('WishlistTab Component', () => {
	const mockPeople = [
		{ id: 1, name: 'John Doe' },
		{ id: 2, name: 'Jane Smith' },
	];

	const mockItems = [
		{ id: 1, item_name: 'Book', link: 'https://example.com/book', image_url: 'https://example.com/book.jpg' },
		{ id: 2, item_name: 'Gadget', link: null, image_url: null },
	];

	beforeEach(() => {
		jest.clearAllMocks();
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/people') return Promise.resolve(mockPeople);
			if (url.startsWith('/api/wishlist/')) return Promise.resolve(mockItems);
			return Promise.resolve([]);
		});
		(api.apiPost as jest.Mock).mockResolvedValue({ success: true });
		(api.apiDelete as jest.Mock).mockResolvedValue({ success: true });
		global.alert = jest.fn();
	});

	it('renders the component with title', async () => {
		render(<WishlistTab />);

		await waitFor(() => {
			expect(screen.getByText('Manage Wishlists')).toBeInTheDocument();
		});
	});

	it('loads and displays people on mount', async () => {
		render(<WishlistTab />);

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/people');
		});

		const personSelect = screen.getByLabelText('Select Person');
		expect(personSelect).toBeInTheDocument();
	});

	it('loads wishlist items when person is selected', async () => {
		render(<WishlistTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Person')).toBeInTheDocument();
		});

		const personSelect = screen.getByLabelText('Select Person');
		fireEvent.change(personSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith('/api/wishlist/1');
			expect(screen.getByText('Book')).toBeInTheDocument();
			expect(screen.getByText('Gadget')).toBeInTheDocument();
		});
	});

	it('adds a new wishlist item successfully', async () => {
		render(<WishlistTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Person')).toBeInTheDocument();
		});

		const personSelect = screen.getByLabelText('Select Person');
		fireEvent.change(personSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(screen.getByText('Book')).toBeInTheDocument();
		});

		const itemInput = screen.getByPlaceholderText('Item name');
		const linkInput = screen.getByPlaceholderText('Link (optional)');
		const imageInput = screen.getByPlaceholderText('Image URL (optional)');
		const addButton = screen.getByText('Add Item');

		fireEvent.change(itemInput, { target: { value: 'New Item' } });
		fireEvent.change(linkInput, { target: { value: 'https://example.com/new' } });
		fireEvent.change(imageInput, { target: { value: 'https://example.com/new.jpg' } });
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith('/api/wishlist/1', {
				item_name: 'New Item',
				link: 'https://example.com/new',
				image_url: 'https://example.com/new.jpg',
			});
		});
	});

	it('shows alert when required fields are missing', async () => {
		render(<WishlistTab />);

		await waitFor(() => {
			expect(screen.getByText('Add Item')).toBeInTheDocument();
		});

		const addButton = screen.getByText('Add Item');
		fireEvent.click(addButton);

		expect(global.alert).toHaveBeenCalledWith('Please select a person and provide an item name');
	});

	it('clears form after successful add', async () => {
		render(<WishlistTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Person')).toBeInTheDocument();
		});

		const personSelect = screen.getByLabelText('Select Person');
		fireEvent.change(personSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(screen.getByText('Book')).toBeInTheDocument();
		});

		const itemInput = screen.getByPlaceholderText('Item name') as HTMLInputElement;
		const linkInput = screen.getByPlaceholderText('Link (optional)') as HTMLInputElement;
		const imageInput = screen.getByPlaceholderText('Image URL (optional)') as HTMLInputElement;
		const addButton = screen.getByText('Add Item');

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

	it('removes a wishlist item', async () => {
		render(<WishlistTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Person')).toBeInTheDocument();
		});

		const personSelect = screen.getByLabelText('Select Person');
		fireEvent.change(personSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(screen.getByText('Book')).toBeInTheDocument();
		});

		const removeButtons = screen.getAllByText('Remove');
		fireEvent.click(removeButtons[0]);

		await waitFor(() => {
			expect(api.apiDelete).toHaveBeenCalledWith('/api/wishlist/item/1');
		});
	});

	it('displays "View Link" for items with links', async () => {
		render(<WishlistTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Person')).toBeInTheDocument();
		});

		const personSelect = screen.getByLabelText('Select Person');
		fireEvent.change(personSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(screen.getByText('View Link')).toBeInTheDocument();
		});

		const link = screen.getByText('View Link');
		expect(link).toHaveAttribute('href', 'https://example.com/book');
		expect(link).toHaveAttribute('target', '_blank');
	});

	it('shows empty state when no items exist', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url === '/api/people') return Promise.resolve(mockPeople);
			if (url.startsWith('/api/wishlist/')) return Promise.resolve([]);
			return Promise.resolve([]);
		});

		render(<WishlistTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Person')).toBeInTheDocument();
		});

		const personSelect = screen.getByLabelText('Select Person');
		fireEvent.change(personSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(screen.getByText('No items yet')).toBeInTheDocument();
		});
	});

	it('handles adding item without optional fields', async () => {
		render(<WishlistTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Person')).toBeInTheDocument();
		});

		const personSelect = screen.getByLabelText('Select Person');
		fireEvent.change(personSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(screen.getByText('Book')).toBeInTheDocument();
		});

		const itemInput = screen.getByPlaceholderText('Item name');
		const addButton = screen.getByText('Add Item');

		fireEvent.change(itemInput, { target: { value: 'Simple Item' } });
		fireEvent.click(addButton);

		await waitFor(() => {
			expect(api.apiPost).toHaveBeenCalledWith('/api/wishlist/1', {
				item_name: 'Simple Item',
				link: '',
				image_url: '',
			});
		});
	});

	it('clears items when no person is selected', async () => {
		render(<WishlistTab />);

		await waitFor(() => {
			expect(screen.getByLabelText('Select Person')).toBeInTheDocument();
		});

		const personSelect = screen.getByLabelText('Select Person');
		fireEvent.change(personSelect, { target: { value: '1' } });

		await waitFor(() => {
			expect(screen.getByText('Book')).toBeInTheDocument();
		});

		fireEvent.change(personSelect, { target: { value: '' } });

		await waitFor(() => {
			expect(screen.queryByText('Book')).not.toBeInTheDocument();
		});
	});
});
