'use client';
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

export default function Page() {
	const { data: session, status } = useSession();

	useEffect(() => {
		if (status === 'authenticated' && session) {
			const user = session.user as any;
			const isAdmin = user.role === 'admin';

			if (isAdmin) {
				redirect('/pools'); // Redirect to the first admin tab
			} else {
				redirect('/my-wishlist'); // Redirect to the first user tab
			}
		}
	}, [session, status]);

	if (status === 'loading') {
		return (
			<div className="text-center py-8">
				<p className="text-gray-600">Loading...</p>
			</div>
		);
	}

	return null; // Or a loading spinner if preferred
}