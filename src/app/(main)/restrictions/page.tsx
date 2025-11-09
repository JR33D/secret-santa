'use client';
import React, { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

type Person = { id: number; name: string; pool_id: number };
type Pool = { id: number; name: string };
type Restriction = {
	id: number;
	giver_name: string;
	receiver_name: string;
	giver_id: number;
	receiver_id: number;
};

export default function Page() {
	const [pools, setPools] = useState<Pool[]>([]);
	const [poolId, setPoolId] = useState<string>('');
	const [people, setPeople] = useState<Person[]>([]);
	const [giver, setGiver] = useState('');
	const [receiver, setReceiver] = useState('');
	const [restrictions, setRestrictions] = useState<Restriction[]>([]);

	useEffect(() => {
		loadPools();
		loadRestrictions();
	}, []);

	useEffect(() => {
		if (poolId) {
			loadPeople();
		} else {
			setPeople([]);
		}
	}, [poolId]);

	async function loadPools() {
		const data = await apiGet<Pool[]>('/api/pools');
		setPools(data);
		if (data.length > 0 && !poolId) {
			setPoolId(String(data[0].id));
		}
	}

	async function loadPeople() {
		if (!poolId) return;
		const data = await apiGet<Person[]>(`/api/people?pool_id=${poolId}`);
		setPeople(data);
	}

	async function loadRestrictions() {
		setRestrictions(await apiGet<Restriction[]>('/api/restrictions'));
	}

	async function addRestriction() {
		if (!giver || !receiver) {
			alert('Select both giver and receiver');
			return;
		}
		if (giver === receiver) {
			alert('Cannot restrict same person');
			return;
		}

		try {
			await apiPost('/api/restrictions', {
				giver_id: Number(giver),
				receiver_id: Number(receiver),
			});
			setGiver('');
			setReceiver('');
			loadRestrictions();
		} catch (error: any) {
			alert(error.message || 'Error adding restriction');
		}
	}

	async function remove(id: number) {
		if (!confirm('Remove this restriction?')) return;
		await apiDelete(`/api/restrictions/${id}`);
		loadRestrictions();
	}

	// Filter restrictions to show only those within the selected pool
	const filteredRestrictions = poolId
		? restrictions.filter((r) => {
				const giverPerson = people.find((p) => p.id === r.giver_id);
				return giverPerson !== undefined;
			})
		: restrictions;

	return (
		<div>
			<h2 className="text-purple-700 text-2xl font-semibold mb-4 border-b-2 border-indigo-200 pb-2">Manage Restrictions</h2>
			<p className="text-gray-600 mb-4 text-sm">Prevent certain people from being assigned to each other (e.g., spouses, siblings)</p>

			{pools.length === 0 ? (
				<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
					<p className="text-yellow-700">⚠️ Please create a pool and add people first.</p>
				</div>
			) : (
				<>
					<div className="mb-4">
						<label htmlFor="pool-select" className="block font-semibold mb-1">
							Select Pool
						</label>
						<select
							id="pool-select"
							className="w-full md:w-1/2 p-2 border rounded"
							value={poolId}
							onChange={(e) => {
								setPoolId(e.target.value);
								setGiver('');
								setReceiver('');
							}}
						>
							<option value="">Select pool...</option>
							{pools.map((p) => (
								<option key={p.id} value={String(p.id)}>
									{p.name}
								</option>
							))}
						</select>
					</div>

					{people.length < 2 ? (
						<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
							<p className="text-yellow-700">This pool needs at least 2 people to add restrictions.</p>
						</div>
					) : (
						<>
							<div className="grid md:grid-cols-2 gap-4 mb-4">
								<div>
									<label htmlFor="giver-select" className="block font-semibold mb-1">
										Giver
									</label>
									<select id="giver-select" className="w-full p-2 border rounded" value={giver} onChange={(e) => setGiver(e.target.value)}>
										<option value="">Select...</option>
										{people.map((p) => (
											<option key={p.id} value={String(p.id)}>
												{p.name}
											</option>
										))}
									</select>
								</div>

								<div>
									<label htmlFor="receiver-select" className="block font-semibold mb-1">
										Cannot Give To
									</label>
									<select id="receiver-select" className="w-full p-2 border rounded" value={receiver} onChange={(e) => setReceiver(e.target.value)}>
										<option value="">Select...</option>
										{people.map((p) => (
											<option key={p.id} value={String(p.id)}>
												{p.name}
											</option>
										))}
									</select>
								</div>
							</div>

							<button onClick={addRestriction} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
								Add Restriction
							</button>
						</>
					)}

					<div className="mt-6">
						<h3 className="text-indigo-600 text-xl font-semibold mb-3">
							Current Restrictions
							{poolId && pools.find((p) => String(p.id) === poolId) && ` - ${pools.find((p) => String(p.id) === poolId)?.name}`}
						</h3>
						{filteredRestrictions.length === 0 && <p className="text-gray-500">No restrictions set</p>}
						{filteredRestrictions.map((r) => (
							<div key={r.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center mt-3">
								<div>
									<strong>{r.giver_name}</strong> → ❌ → <strong>{r.receiver_name}</strong>
								</div>
								<button onClick={() => remove(r.id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition">
									Delete
								</button>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}
