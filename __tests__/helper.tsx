import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Custom render function that includes providers if needed
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => render(ui, { ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock data generators
export const mockPerson = (overrides = {}) => ({
	id: 1,
	name: 'Test Person',
	email: 'test@example.com',
	...overrides,
});

export const mockWishlistItem = (overrides = {}) => ({
	id: 1,
	item_name: 'Test Item',
	link: 'https://example.com',
	image_url: 'https://example.com/image.jpg',
	...overrides,
});

export const mockRestriction = (overrides = {}) => ({
	id: 1,
	giver_id: 1,
	receiver_id: 2,
	giver_name: 'Alice',
	receiver_name: 'Bob',
	...overrides,
});

export const mockAssignment = (overrides = {}) => ({
	id: 1,
	year: 2024,
	giver_id: 1,
	receiver_id: 2,
	giver_name: 'Alice',
	receiver_name: 'Bob',
	...overrides,
});

// Database mock helpers
export const createMockDb = () => ({
	all: jest.fn(),
	get: jest.fn(),
	run: jest.fn(),
	exec: jest.fn(),
});

// API response helpers
export const mockSuccessResponse = (data: any) =>
	Promise.resolve({
		ok: true,
		json: async () => data,
		text: async () => JSON.stringify(data),
	} as Response);

export const mockErrorResponse = (message: string, status = 500) =>
	Promise.resolve({
		ok: false,
		status,
		text: async () => message,
	} as Response);
