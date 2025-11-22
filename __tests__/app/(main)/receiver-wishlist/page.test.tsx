import Image, { ImageProps } from 'next/image';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Page from '@/app/(main)/receiver-wishlist/page';
import { useSession } from 'next-auth/react';
import * as api from '@/lib/api';

jest.mock('next-auth/react');
jest.mock('@/lib/api');

// Mock next/image
jest.mock(
    'next/image',
    () =>
        ({
            __esModule: true,
            default: (props: ImageProps) => {                 
				// eslint-disable-next-line jsx-a11y/alt-text
                return <Image width={200} height={100} {...props} />;
            },
        })
);

describe('Receiver Wishlist Page', () => {
	const mockSession = {
		data: {
			user: { id: '1', name: 'Test User', email: 'test@example.com', personId: 101 },
		},
		status: 'authenticated',
	};

	const mockAssignment = {
		receiver_id: 201,
		receiver_name: 'Gift Recipient',
		year: new Date().getFullYear(),
	};

	const mockReceiverWishlist = [
		{ id: 1, item_name: 'Fancy Watch', link: 'http://watch.com', image_url: 'http://watch.com/image.jpg' },
		{ id: 2, item_name: 'Coffee Maker', link: '', image_url: '' },
	];

	beforeEach(() => {
		jest.clearAllMocks();
		(useSession as jest.Mock).mockReturnValue(mockSession);
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url.includes('/api/my-assignment')) {
				return Promise.resolve([mockAssignment]);
			}
			if (url.includes(`/api/wishlist/${mockAssignment.receiver_id}`)) {
				return Promise.resolve(mockReceiverWishlist);
			}
			return Promise.resolve([]);
		});
	});

	it('renders the receiver wishlist page with an assignment', async () => {
		render(<Page />);

		await waitFor(() => {
			expect(screen.getByText('Their Wishlist')).toBeInTheDocument();
			expect(screen.getByText(/You are the Secret Santa for:/i)).toBeInTheDocument();
			expect(screen.getByText('🎁 Gift Recipient 🎁')).toBeInTheDocument();
			expect(screen.getByText("Gift Recipient's Wishlist")).toBeInTheDocument();

			expect(screen.getByText(/Fancy Watch/i)).toBeInTheDocument();
			expect(screen.getByText(/Coffee Maker/i)).toBeInTheDocument();
		});
	});

	it('loads assignment and receiver wishlist on mount', async () => {
		render(<Page />);
		await waitFor(() => {
			expect(api.apiGet).toHaveBeenCalledWith(`/api/my-assignment?person_id=101&year=${new Date().getFullYear()}`);
			expect(api.apiGet).toHaveBeenCalledWith(`/api/wishlist/${mockAssignment.receiver_id}`);
		});
	});

	it('shows loading state', () => {
		(api.apiGet as jest.Mock).mockReturnValue(new Promise(() => {})); // Never resolve
		render(<Page />);
		expect(screen.getByText('Loading...')).toBeInTheDocument();
	});

	it('shows no assignment message if no assignment found', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url.includes('/api/my-assignment')) {
				return Promise.resolve([]); // No assignment
			}
			return Promise.resolve([]);
		});

		render(<Page />);

		await waitFor(() => {
			expect(screen.getByText(`🎁 No assignment yet for ${new Date().getFullYear()}`)).toBeInTheDocument();
			expect(screen.getByText("Once the Secret Santa assignments are generated, you'll see your recipient's wishlist here!")).toBeInTheDocument();
		});
	});

	it('shows empty wishlist message if receiver has no items', async () => {
		(api.apiGet as jest.Mock).mockImplementation((url: string) => {
			if (url.includes('/api/my-assignment')) {
				return Promise.resolve([mockAssignment]);
			}
			if (url.includes(`/api/wishlist/${mockAssignment.receiver_id}`)) {
				return Promise.resolve([]); // Empty wishlist
			}
			return Promise.resolve([]);
		});

		render(<Page />);

		await waitFor(() => {
			expect(screen.getByText(`${mockAssignment.receiver_name} hasn't added any items to their wishlist yet.`)).toBeInTheDocument();
		});
	});

	it('shows error if personId is not available', () => {
		(useSession as jest.Mock).mockReturnValue({
			data: { user: { id: '1', name: 'Test User', email: 'test@example.com' } }, // No personId
			status: 'authenticated',
		});
		render(<Page />);
		expect(screen.getByText('Your account is not linked to a person. Please contact an administrator.')).toBeInTheDocument();
	});
});
