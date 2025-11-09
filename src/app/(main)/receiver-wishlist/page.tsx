 'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { apiGet } from '@/lib/api';

type Item = {
	id: number;
	item_name: string;
	link?: string;
	image_url?: string;
};

type Assignment = {
	receiver_id: number;
	receiver_name: string;
	year: number;
};

export default function Page() {
	const { data: session } = useSession();
	const [assignment, setAssignment] = useState<Assignment | null>(null);
	const [items, setItems] = useState<Item[]>([]);
	const [loading, setLoading] = useState(true);

	const personId = (session?.user as any)?.personId;
	const currentYear = new Date().getFullYear();

	useEffect(() => {
		if (personId) {
			loadAssignment();
		}
	}, [personId]);

	async function loadAssignment() {
		if (!personId) return;

		setLoading(true);
		try {
			// Get all assignments for current user
			const assignments = await apiGet<any[]>(`/api/my-assignment?person_id=${personId}&year=${currentYear}`);

			if (assignments.length > 0) {
				const currentAssignment = assignments[0];
				setAssignment(currentAssignment);

				// Load receiver's wishlist
				const wishlist = await apiGet<Item[]>(`/api/wishlist/${currentAssignment.receiver_id}`);
				setItems(wishlist);
			} else {
				setAssignment(null);
				setItems([]);
			}
		} catch (err) {
			console.error(err);
			setAssignment(null);
			setItems([]);
		} finally {
			setLoading(false);
		}
	}

	if (!personId) {
		return (
			<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
				<p className="text-yellow-700">Your account is not linked to a person. Please contact an administrator.</p>
			</div>
		);
	}

	if (loading) {
		return (
			<div className="text-center py-8">
				<p className="text-gray-600">Loading...</p>
			</div>
		);
	}

	if (!assignment) {
		return (
			<div>
				<h2 className="text-purple-700 text-2xl font-semibold mb-4 border-b-2 border-indigo-200 pb-2">
					<span className="inline-flex items-center gap-3">
						<Image src="/images/logo_transparent.png" alt="Logo" width={28} height={28} />
						<span>Their Wishlist</span>
					</span>
				</h2>
				<div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg text-center">
					<p className="text-blue-800 text-lg mb-2">🎁 No assignment yet for {currentYear}</p>
					<p className="text-blue-700 text-sm">Once the Secret Santa assignments are generated, you&apos;ll see your recipient&apos;s wishlist here!</p>
				</div>
			</div>
		);
	}

	return (
		<div>
			<h2 className="text-purple-700 text-2xl font-semibold mb-4 border-b-2 border-indigo-200 pb-2">
				<span className="inline-flex items-center gap-3">
					<Image src="/images/logo_transparent.png" alt="Logo" width={28} height={28} />
					<span>Their Wishlist</span>
				</span>
			</h2>

			<div className="bg-gradient-to-r from-green-50 to-red-50 border-2 border-green-300 p-6 rounded-lg mb-6">
				<div className="text-center">
					<p className="text-lg text-gray-700 mb-2">You are the Secret Santa for:</p>
					<h3 className="text-3xl font-bold text-indigo-600">🎁 {assignment.receiver_name} 🎁</h3>
					<p className="text-sm text-gray-600 mt-2">Secret Santa {currentYear}</p>
				</div>
			</div>

			<div>
				<h3 className="text-indigo-600 text-xl font-semibold mb-3">{assignment.receiver_name}&apos;s Wishlist</h3>

				{items.length === 0 ? (
					<div className="text-center py-8 bg-gray-50 rounded-lg">
						<p className="text-gray-600">{assignment.receiver_name} hasn&apos;t added any items to their wishlist yet.</p>
						<p className="text-sm text-gray-500 mt-2">Check back later, or surprise them with something thoughtful! 🎁</p>
					</div>
				) : (
					<div className="space-y-4">
						{items.map((item) => (
							<div key={item.id} className="bg-white border-2 border-indigo-200 p-5 rounded-lg shadow-sm hover:shadow-md transition">
								<h4 className="text-xl font-semibold text-gray-800 mb-2">🎁 {item.item_name}</h4>

								{item.link && (
									<a href={item.link} target="_blank" rel="noreferrer" className="inline-block mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition text-sm">
										🔗 View Link
									</a>
								)}

								{item.image_url && (
									<div className="mt-4">
										<img
											src={item.image_url}
											alt={item.item_name}
											className="max-w-md max-h-64 rounded-lg border-2 border-gray-200 shadow-sm"
											onError={(e) => {
												(e.target as HTMLImageElement).style.display = 'none';
											}}
										/>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
