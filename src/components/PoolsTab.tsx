'use client';
import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

type Pool = { id: number; name: string; description: string; member_count?: number };

export default function PoolsTab() {
	const [pools, setPools] = useState<Pool[]>([]);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [loading, setLoading] = useState(false);

	async function load() {
		setLoading(true);
		try {
			const data = await apiGet<Pool[]>('/api/pools');
			setPools(data);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		load();
	}, []);

	async function addPool() {
		if (!name) {
			alert('Please enter a pool name');
			return;
		}
		try {
			await apiPost('/api/pools', { name, description });
			setName('');
			setDescription('');
			load();
		} catch (err: any) {
			alert(String(err.message || err));
		}
	}

	async function remove(id: number) {
		if (!confirm('Delete this pool? All people must be removed from it first.')) return;
		try {
			await apiDelete(`/api/pools/${id}`);
			load();
		} catch (err: any) {
			alert(String(err.message || err));
		}
	}

	return (
		<div>
			<h2 className="text-purple-700 text-2xl font-semibold mb-4 border-b-2 border-indigo-200 pb-2">Manage Pools</h2>
			<p className="text-gray-600 mb-4 text-sm">Create separate pools for different groups (Family, Friends, Coworkers, etc.)</p>

			<div className="grid md:grid-cols-2 gap-4 mb-4">
				<div>
					<label htmlFor="pool-name-input" className="block font-semibold mb-1">
						Pool Name
					</label>
					<input id="pool-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Family, Friends, Coworkers" className="w-full p-2 border rounded" />
				</div>
				<div>
					<label htmlFor="pool-description-input" className="block font-semibold mb-1">
						Description (Optional)
					</label>
					<input id="pool-description-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Annual family gift exchange" className="w-full p-2 border rounded" />
				</div>
			</div>

			<button onClick={addPool} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
				Create Pool
			</button>

			<div className="mt-6">
				<h3 className="text-indigo-600 text-xl font-semibold mb-3">Current Pools</h3>
				{loading ? (
					<p>Loading...</p>
				) : pools.length === 0 ? (
					<p className="text-gray-500">No pools yet</p>
				) : (
					pools.map((p) => (
						<div key={p.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center mt-3">
							<div>
								<strong className="text-lg">{p.name}</strong>
								{p.description && <div className="text-sm text-gray-600">{p.description}</div>}
								<div className="text-xs text-indigo-600 mt-1">
									👥 {p.member_count || 0} member{p.member_count !== 1 ? 's' : ''}
								</div>
							</div>
							<button onClick={() => remove(p.id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition">
								Delete
							</button>
						</div>
					))
				)}
			</div>
		</div>
	);
}
