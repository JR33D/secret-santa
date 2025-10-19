'use client';
import React, { useEffect, useState } from 'react';
import { apiPost, apiGet, apiDelete } from '@/lib/api';

type Assignment = { giver_name: string; receiver_name: string; pool_name: string };
type Pool = { id: number; name: string; member_count: number };

export default function GenerateTab() {
	const [year, setYear] = useState<string>(String(new Date().getFullYear()));
	const [poolId, setPoolId] = useState<string>('');
	const [pools, setPools] = useState<Pool[]>([]);
	const [result, setResult] = useState<string | null>(null);
	const [assignments, setAssignments] = useState<Assignment[]>([]);
	const [allCount, setAllCount] = useState(0);

	useEffect(() => {
		loadPools();
	}, []);

	useEffect(() => {
		if (poolId) {
			loadAssignments();
		}
	}, [year, poolId]);

	async function loadPools() {
		const data = await apiGet<Pool[]>('/api/pools');
		setPools(data);
		if (data.length > 0 && !poolId) {
			setPoolId(String(data[0].id));
		}
	}

	async function generate() {
		if (!poolId) {
			alert('Please select a pool');
			return;
		}

		setResult('Generating...');
		try {
			const res = await apiPost<{ success: boolean; message: string }>(`/api/generate/${year}?pool_id=${poolId}`);
			setResult(res.message);
			loadAssignments();
		} catch (error: any) {
			setResult(`Error: ${error.message || error}`);
		}
	}

	async function loadAssignments() {
		if (!poolId) return;

		const data = await apiGet<Assignment[]>(`/api/assignments/${year}?pool_id=${poolId}`);
		setAssignments(data);

		const all = await apiGet<any[]>('/api/assignments');
		setAllCount(all.length);
	}

	async function deleteAssignments() {
		if (!confirm(`Delete all ${year} assignments for this pool?`)) return;

		try {
			await apiDelete(`/api/assignments/${year}?pool_id=${poolId}`);
			setResult('Assignments deleted successfully');
			loadAssignments();
		} catch (error: any) {
			setResult(`Error: ${error.message || error}`);
		}
	}

	async function sendNotifications() {
		if (!confirm('Send email notifications to all participants?')) return;
		const res = await apiPost<any[]>(`/api/send-notifications/${year}?pool_id=${poolId}`);
		setResult('Email results:\n' + JSON.stringify(res, null, 2));
	}

	const selectedPool = pools.find((p) => String(p.id) === poolId);

	return (
		<div>
			<h2 className="text-purple-700 text-2xl font-semibold mb-4 border-b-2 border-indigo-200 pb-2">Generate Assignments</h2>

			{pools.length === 0 ? (
				<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
					<p className="text-yellow-700">⚠️ Please create a pool and add people first.</p>
				</div>
			) : (
				<>
					<div className="grid md:grid-cols-3 gap-4 mb-4">
						<div>
							<label htmlFor="pool-select" className="block font-semibold mb-1">
								Pool
							</label>
							<select id="pool-select" value={poolId} onChange={(e) => setPoolId(e.target.value)} className="w-full p-2 border rounded">
								<option value="">Select pool...</option>
								{pools.map((p) => (
									<option key={p.id} value={String(p.id)}>
										{p.name} ({p.member_count} people)
									</option>
								))}
							</select>
						</div>
						<div>
							<label htmlFor="year-input" className="block font-semibold mb-1">
								Year
							</label>
							<input id="year-input" type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-full p-2 border rounded" />
						</div>
						<div className="flex items-end">
							<button onClick={generate} disabled={!poolId} className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
								🎲 Generate
							</button>
						</div>
					</div>

					{selectedPool && selectedPool.member_count < 2 && (
						<div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
							<p className="text-red-700">⚠️ This pool needs at least 2 people to generate assignments.</p>
						</div>
					)}

					{result && (
						<div className="mt-4">
							<div className={`p-3 rounded whitespace-pre-wrap ${result.includes('Error') || result.includes('already exist') ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'}`}>{result}</div>
						</div>
					)}

					<div id="currentAssignments" className="mt-6">
						<div className="flex justify-between items-center mb-2">
							<h3 className="text-indigo-600 text-xl font-semibold">
								Assignments for {year}
								{selectedPool && ` - ${selectedPool.name}`}
							</h3>
							{assignments.length > 0 && (
								<button onClick={deleteAssignments} className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition">
									Delete All
								</button>
							)}
						</div>

						{assignments.length === 0 ? (
							<p className="text-gray-500">No assignments yet for this pool and year.</p>
						) : (
							<>
								{assignments.map((a, i) => (
									<div key={i} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center mt-3">
										<span>
											<strong>{a.giver_name}</strong> → 🎁 → <strong>{a.receiver_name}</strong>
										</span>
									</div>
								))}

								<p className="text-sm text-gray-500 mt-2">
									📊 Showing {assignments.length} assignments for this pool. Total in system: {allCount}
								</p>

								<button onClick={sendNotifications} className="mt-3 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
									📧 Send Email Notifications
								</button>
							</>
						)}
					</div>
				</>
			)}
		</div>
	);
}
