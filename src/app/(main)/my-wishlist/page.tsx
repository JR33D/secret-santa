'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

type Item = {
	id: number;
	item_name: string;
	link?: string;
	image_url?: string;
};

export default function Page() {
	const { data: session } = useSession();
	const [items, setItems] = useState<Item[]>([]);
	const [itemName, setItemName] = useState('');
	const [link, setLink] = useState('');
	const [image, setImage] = useState('');
	const [loading, setLoading] = useState(true);

	const personId = (session?.user as any)?.personId;

	useEffect(() => {
		if (personId) {
			loadItems();
		}
	}, [personId]);

	async function loadItems() {
		if (!personId) return;

		setLoading(true);
		try {
			const data = await apiGet<Item[]>(`/api/wishlist/${personId}`);
			setItems(data);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	async function addItem() {
		if (!itemName) {
			alert('Please provide an item name');
			return;
		}

		try {
			await apiPost(`/api/wishlist/${personId}`, {
				item_name: itemName,
				link,
				image_url: image,
			});
			setItemName('');
			setLink('');
			setImage('');
			loadItems();
		} catch (err: any) {
			alert(err.message || 'Failed to add item');
		}
	}

	async function removeItem(id: number) {
		if (!confirm('Remove this item from your wishlist?')) return;

		try {
			await apiDelete(`/api/wishlist/item/${id}`);
			loadItems();
		} catch (err) {
			console.error(err);
		}
	}

	if (!personId) {
		return (
			<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
				<p className="text-yellow-700">Your account is not linked to a person. Please contact an administrator.</p>
			</div>
		);
	}

	return (
		<div>
			<h2 className="text-purple-700 text-2xl font-semibold mb-4 border-b-2 border-indigo-200 pb-2">🎁 My Wishlist</h2>
			<p className="text-gray-600 mb-4 text-sm">Add items you&apos;d like to receive this year. Your Secret Santa will see this list!</p>

			{/* Add Item Form */}
			<div className="bg-gray-50 p-4 rounded-lg mb-6">
				<h3 className="text-lg font-semibold text-gray-800 mb-3">Add New Item</h3>

				<div className="grid md:grid-cols-3 gap-3 mb-3">
					<input placeholder="Item name *" className="p-2 border rounded" value={itemName} onChange={(e) => setItemName(e.target.value)} />
					<input placeholder="Link (optional)" className="p-2 border rounded" value={link} onChange={(e) => setLink(e.target.value)} />
					<input placeholder="Image URL (optional)" className="p-2 border rounded" value={image} onChange={(e) => setImage(e.target.value)} />
				</div>

				<button onClick={addItem} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
					Add to Wishlist
				</button>
			</div>

			{/* Items List */}
			<div>
				<h3 className="text-indigo-600 text-xl font-semibold mb-3">Your Wishlist Items</h3>

				{loading ? (
					<p className="text-gray-500">Loading...</p>
				) : items.length === 0 ? (
					<div className="text-center py-8 text-gray-500">
						<p className="text-lg">Your wishlist is empty</p>
						<p className="text-sm mt-2">Add some items above to get started!</p>
					</div>
				) : (
					<div className="space-y-3">
						{items.map((item) => (
							<div key={item.id} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition">
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<h4 className="text-lg font-semibold text-gray-800">{item.item_name}</h4>

										{item.link && (
											<a href={item.link} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline mt-1 inline-block">
												🔗 View Link
											</a>
										)}

										{item.image_url && (
											<div className="mt-2">
												<img
													src={item.image_url}
													alt={item.item_name}
													className="max-w-xs max-h-40 rounded border border-gray-200"
													onError={(e) => {
														(e.target as HTMLImageElement).style.display = 'none';
													}}
												/>
											</div>
										)}
									</div>

									<button onClick={() => removeItem(item.id)} className="ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition">
										Remove
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
