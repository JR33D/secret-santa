import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tabs from '@/components/Tabs';

describe('Tabs Component', () => {
	const mockTabs = [
		{ id: 'people', label: '👥 People' },
		{ id: 'wishlist', label: '🎁 Wishlists' },
		{ id: 'restrictions', label: '🚫 Restrictions' },
	];

	const mockOnChange = jest.fn();

	beforeEach(() => {
		mockOnChange.mockClear();
	});

	it('renders all tabs', () => {
		render(<Tabs tabs={mockTabs} active="people" onChange={mockOnChange} />);

		expect(screen.getByText('👥 People')).toBeInTheDocument();
		expect(screen.getByText('🎁 Wishlists')).toBeInTheDocument();
		expect(screen.getByText('🚫 Restrictions')).toBeInTheDocument();
	});

	it('highlights the active tab', () => {
		render(<Tabs tabs={mockTabs} active="wishlist" onChange={mockOnChange} />);

		const wishlistTab = screen.getByText('🎁 Wishlists');
		expect(wishlistTab).toHaveClass('text-indigo-600', 'font-bold', 'border-b-4', 'border-indigo-400');
	});

	it('applies non-active styling to inactive tabs', () => {
		render(<Tabs tabs={mockTabs} active="wishlist" onChange={mockOnChange} />);

		const peopleTab = screen.getByText('👥 People');
		expect(peopleTab).toHaveClass('text-gray-600', 'hover:text-indigo-500');
		expect(peopleTab).not.toHaveClass('text-indigo-600');
	});

	it('calls onChange when tab is clicked', () => {
		render(<Tabs tabs={mockTabs} active="people" onChange={mockOnChange} />);

		const wishlistTab = screen.getByText('🎁 Wishlists');
		fireEvent.click(wishlistTab);

		expect(mockOnChange).toHaveBeenCalledWith('wishlist');
		expect(mockOnChange).toHaveBeenCalledTimes(1);
	});

	it('renders with overflow-x-auto for responsive scrolling', () => {
		const { container } = render(<Tabs tabs={mockTabs} active="people" onChange={mockOnChange} />);

		const tabContainer = container.querySelector('.overflow-x-auto');
		expect(tabContainer).toBeInTheDocument();
	});

	it('renders with empty tabs array', () => {
		render(<Tabs tabs={[]} active="" onChange={mockOnChange} />);

		const buttons = screen.queryAllByRole('button');
		expect(buttons).toHaveLength(0);
	});

	it('applies whitespace-nowrap to prevent text wrapping', () => {
		render(<Tabs tabs={mockTabs} active="people" onChange={mockOnChange} />);

		const peopleTab = screen.getByText('👥 People');
		expect(peopleTab).toHaveClass('whitespace-nowrap');
	});
});
