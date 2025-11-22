'use client';
import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

type Person = { id: number; name: string };
type Item = { id: number; item_name: string; link?: string; image_url?: string };

export default function Page() {
	const [people, setPeople] = useState<Person[]>([]);
	const [personId, setPersonId] = useState<string>('');
	const [items, setItems] = useState<Item[]>([]);
	const [itemName, setItemName] = useState('');
	const [link, setLink] = useState('');
	const [image, setImage] = useState('');

	// Load people safely inside useEffect
	useEffect(() => {
		async function fetchPeople() {
			const p = await apiGet<Person[]>('/api/people');
			setPeople(p);
		}
		fetchPeople();
	}, []);

	// Load wishlist items when personId changes
	useEffect(() => {
		async function fetchItems() {
			if (!personId) {
				setItems([]);
				return;
			}
			const data = await apiGet<Item[]>(`/api/wishlist/${personId}`);
			setItems(data);
		}
		fetchItems();
	}, [personId]);

	async function addItem() {
		if (!personId || !itemName) {
			alert('Please select a person and provide an item name');
			return;
		}

		await apiPost(`/api/wishlist/${personId}`, { item_name: itemName, link, image_url: image });
		setItemName('');
		setLink('');
		setImage('');

		// Refresh items
		const data = await apiGet<Item[]>(`/api/wishlist/${personId}`);
		setItems(data);
	}

	async function removeItem(id: number) {
		await apiDelete(`/api/wishlist/item/${id}`);
		const data = await apiGet<Item[]>(`/api/wishlist/${personId}`);
		setItems(data);
	}

	return (
		<div>
			<h2 className="text-purple-700 text-2xl font-semibold mb-4 border-b-2 border-indigo-200 pb-2">Manage Wishlists</h2>

			<div className="grid md:grid-cols-2 gap-4 mb-4">
				<div>
					<label htmlFor="person-select" className="block font-semibold mb-1">
						Select Person
					</label>
					<select
						id="person-select"
						className="w-full p-2 border rounded"
						value={personId}
						onChange={(e) => setPersonId(e.target.value)}
					>
						<option value="">Select...</option>
						{people.map((p) => (
							<option key={p.id} value={String(p.id)}>
								{p.name}
							</option>
						))}
					</select>
				</div>
				<div />
			</div>

			<div className="grid md:grid-cols-3 gap-4 mt-3">
				<input placeholder="Item name" className="p-2 border rounded" value={itemName} onChange={(e) => setItemName(e.target.value)} />
				<input placeholder="Link (optional)" className="p-2 border rounded" value={link} onChange={(e) => setLink(e.target.value)} />
				<input placeholder="Image URL (optional)" className="p-2 border rounded" value={image} onChange={(e) => setImage(e.target.value)} />
			</div>

			<button onClick={addItem} className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
				Add Item
			</button>

			<div className="mt-6">
				<h3 className="text-indigo-600 text-xl font-semibold mb-3">Wishlist Items</h3>
				{items.length === 0 && <p className="text-gray-500">No items yet</p>}

				{items.map((i) => (
					<div key={i.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center mt-3">
						<div>
							<strong>{i.item_name}</strong>
							{i.link && (
								<div className="text-sm">
									<a href={i.link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
										View Link
									</a>
								</div>
							)}
						</div>
						<div className="flex flex-col items-end">
							<button
								onClick={() => removeItem(i.id)}
								className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
							>
								Remove
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
