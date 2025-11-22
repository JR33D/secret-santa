'use client';
import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

type Person = { id: number; name: string; email: string; pool_id?: number; pool_name?: string };
type Pool = { id: number; name: string };

export default function Page() {
	const [people, setPeople] = useState<Person[]>([]);
	const [pools, setPools] = useState<Pool[]>([]);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [poolId, setPoolId] = useState('');
	const [filterPoolId, setFilterPoolId] = useState('all');
	const [loading, setLoading] = useState(false);
	const [emailError, setEmailError] = useState('');

	async function loadPools() {
		const data = await apiGet<Pool[]>('/api/pools');
		setPools(data);
		if (data.length > 0 && !poolId) {
			setPoolId(String(data[0].id));
		}
	}

	async function load() {
		setLoading(true);
		try {
			const data = await apiGet<Person[]>('/api/people');
			setPeople(data);
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : err);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadPools();
		load();
	}, []);

	// Email validation function
	function validateEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	// Handle email input change with validation
	function handleEmailChange(value: string) {
		setEmail(value);
		if (value && !validateEmail(value)) {
			setEmailError('Please enter a valid email address');
		} else {
			setEmailError('');
		}
	}

	async function addPerson() {
		if (!name || !email || !poolId) {
			alert('Please fill in all fields');
			return;
		}

		if (!validateEmail(email)) {
			alert('Please enter a valid email address');
			return;
		}

		try {
			await apiPost('/api/people', { name, email, pool_id: Number(poolId) });
			setName('');
			setEmail('');
			setEmailError('');
			load();
		} catch (err: unknown) {
			alert(String(err instanceof Error ? err.message : err));
		}
	}

	async function remove(id: number) {
		if (!confirm('Delete this person?')) return;
		try {
			await apiDelete(`/api/people/${id}`);
			load();
		} catch (err: unknown) {
			console.error(err instanceof Error ? err.message : err);
		}
	}

	const filteredPeople = filterPoolId === 'all' ? people : people.filter((p) => String(p.pool_id) === filterPoolId);

	return (
		<div>
			<h2 className="text-purple-700 text-2xl font-semibold mb-4 border-b-2 border-indigo-200 pb-2">Manage People</h2>

			{pools.length === 0 ? (
				<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
					<p className="text-yellow-700">⚠️ Please create a pool first in the Pools tab before adding people.</p>
				</div>
			) : (
				<>
					<div className="grid md:grid-cols-3 gap-4 mb-4">
						<div>
							<label htmlFor="person-name-input" className="block font-semibold mb-1">
								Name
							</label>
							<input id="person-name-input" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded" placeholder="John Doe" />
						</div>
						<div>
							<label htmlFor="person-email-input" className="block font-semibold mb-1">
								Email
							</label>
							<input
								id="person-email-input"
								type="email"
								value={email}
								onChange={(e) => handleEmailChange(e.target.value)}
								className={`w-full p-2 border rounded ${emailError ? 'border-red-500' : ''}`}
								placeholder="john@example.com"
							/>
							{emailError && <p className="text-red-600 text-xs mt-1">{emailError}</p>}
							<p className="text-gray-500 text-xs mt-1">Required for user account creation and notifications</p>
						</div>
						<div>
							<label htmlFor="person-pool-select" className="block font-semibold mb-1">
								Pool
							</label>
							<select id="person-pool-select" value={poolId} onChange={(e) => setPoolId(e.target.value)} className="w-full p-2 border rounded">
								<option value="">Select pool...</option>
								{pools.map((pool) => (
									<option key={pool.id} value={String(pool.id)}>
										{pool.name}
									</option>
								))}
							</select>
						</div>
					</div>

					<button
						onClick={addPerson}
						disabled={!!emailError || !name || !email || !poolId}
						className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
					>
						Add Person
					</button>
				</>
			)}

			<div className="mt-6">
				<div className="flex justify-between items-center mb-3">
					<h3 className="text-indigo-600 text-xl font-semibold">Current People</h3>
					<select value={filterPoolId} onChange={(e) => setFilterPoolId(e.target.value)} className="p-2 border rounded text-sm">
						<option value="all">All Pools</option>
						{pools.map((pool) => (
							<option key={pool.id} value={String(pool.id)}>
								{pool.name}
							</option>
						))}
					</select>
				</div>

				{loading ? (
					<p>Loading...</p>
				) : filteredPeople.length === 0 ? (
					<p className="text-gray-500">No people yet</p>
				) : (
					filteredPeople.map((p) => (
						<div key={p.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center mt-3">
							<div>
								<strong>{p.name}</strong>
								<div className="text-sm text-gray-600">{p.email}</div>
								{p.pool_name && <div className="text-xs text-indigo-600 mt-1">📁 {p.pool_name}</div>}
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
