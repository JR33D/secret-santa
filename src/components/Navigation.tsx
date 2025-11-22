'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';

export default function Navigation() {
	const pathname = usePathname();
	const { data: session } = useSession();

	const user = session?.user as Session['user'];
	const isAdmin = user?.role === 'admin';

	const adminNavItems = [
		{ href: '/pools', label: '🏊 Pools' },
		{ href: '/people', label: '👥 People' },
		{ href: '/users', label: '🔐 Users' },
		{ href: '/wishlist', label: '🎁 Wishlists' },
		{ href: '/restrictions', label: '🚫 Restrictions' },
		{ href: '/generate', label: '✨ Generate' },
		{ href: '/history', label: '📊 History' },
		{ href: '/email', label: '📧 Email Config' },
	];

	const userNavItems = [
		{ href: '/my-wishlist', label: '🎁 My Wishlist' },
		{ href: '/receiver-wishlist', label: 'Their Wishlist' },
	];

	const navItems = isAdmin ? adminNavItems : userNavItems;

	return (
		<nav className="flex gap-2 mb-4 border-b pb-2 overflow-x-auto">
			{navItems.map((item) => (
				<Link
					key={item.href}
					href={item.href}
					className={`px-4 py-2 text-sm font-medium transition whitespace-nowrap ${
						pathname.startsWith(item.href) ? 'text-indigo-600 font-bold border-b-4 border-indigo-400' : 'text-gray-600 hover:text-indigo-500'
					}`}
				>
					{item.label}
				</Link>
			))}
		</nav>
	);
}
