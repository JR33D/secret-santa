'use client';
import React, { useEffect, useRef, useState } from 'react';
import { apiGet } from '@/lib/api';

type Pool = { id: number; name: string };

export default function Page() {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const [chains, setChains] = useState<string[]>([]);
	const [pools, setPools] = useState<Pool[]>([]);
	const [poolId, setPoolId] = useState<string>('all');

	useEffect(() => {
		loadPools();
	}, []);

	useEffect(() => {
		loadGraph();
		loadChains();
	}, [poolId]);

	async function loadPools() {
		const data = await apiGet<Pool[]>('/api/pools');
		setPools(data);
	}

	async function loadGraph() {
		const url = poolId === 'all' ? '/api/history-graph' : `/api/history-graph?pool_id=${poolId}`;
		const data = await apiGet<{ 
			nodes: string[];
			links: { year: number; giver: string; receiver: string }[];
		}>(url);
		drawHistoryGraph(data);
	}

	async function loadChains() {
		const url = poolId === 'all' ? '/api/assignments' : `/api/assignments?pool_id=${poolId}`;
		const assignments = await apiGet<any[]>(url);

		const byYear: any = {};
		assignments.forEach((a) => {
			if (!byYear[a.year]) byYear[a.year] = [];
			byYear[a.year].push(a);
		});

		const list: string[] = [];
		Object.keys(byYear)
			.sort((a, b) => Number(b) - Number(a))
			.forEach((year) => {
				const yearAssignments = byYear[year];
				const map: any = {};
				yearAssignments.forEach((a: any) => (map[a.giver_name] = a.receiver_name));
				const visited = new Set();
				const chainsForYear: string[] = [];

				Object.keys(map).forEach((start) => {
					if (visited.has(start)) return;
					const chain: string[] = [];
					let current = start;
					const localVisited = new Set();

					while (current && !localVisited.has(current) && !visited.has(current)) {
						chain.push(current);
						localVisited.add(current);
						current = map[current];
					}

					const isLoop = current && localVisited.has(current);
					if (isLoop) {
						const loopStartIdx = chain.indexOf(current);
						const loopMembers = chain.slice(loopStartIdx);
						chainsForYear.push(`${loopMembers.join(' → ')} → ${current} ✓ (Loop)`);
					} else {
						if (current) chain.push(current);
						chainsForYear.push(chain.join(' → '));
					}
					localVisited.forEach((p: any) => visited.add(p));
				});

				const poolName = yearAssignments[0]?.pool_name || 'Unknown Pool';
				list.push(`${year} - ${poolName}:`);
				chainsForYear.forEach((c) => list.push(c));
			});
		setChains(list);
	}

	function drawHistoryGraph(data: { nodes: string[]; links: { year: number; giver: string; receiver: string }[] }) {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		canvas.width = canvas.offsetWidth;
		canvas.height = 500;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (data.links.length === 0) {
			ctx.font = '20px Arial';
			ctx.fillStyle = '#999';
			ctx.textAlign = 'center';
			ctx.fillText('No assignment history yet', canvas.width / 2, canvas.height / 2);
			return;
		}

		const nodePositions: any = {};
		const radius = Math.min(canvas.width, canvas.height) * 0.35;
		const centerX = canvas.width / 2;
		const centerY = canvas.height / 2;

		data.nodes.forEach((node, i) => {
			const angle = (i / data.nodes.length) * 2 * Math.PI - Math.PI / 2;
			nodePositions[node] = {
				x: centerX + radius * Math.cos(angle),
				y: centerY + radius * Math.sin(angle),
			};
		});

		const years = Array.from(new Set(data.links.map((l) => l.year))).sort();
		const colorMap: any = {};
		years.forEach((y, i) => {
			const hue = (i / years.length) * 360;
			colorMap[y] = `hsl(${hue} 70% 50%)`;
		});

		data.links.forEach((link) => {
			const from = nodePositions[link.giver];
			const to = nodePositions[link.receiver];
			if (!from || !to) return;
			ctx.beginPath();
			ctx.moveTo(from.x, from.y);
			ctx.lineTo(to.x, to.y);
			ctx.strokeStyle = colorMap[link.year];
			ctx.lineWidth = 2;
			ctx.stroke();

			const dx = to.x - from.x;
			const dy = to.y - from.y;
			const angle = Math.atan2(dy, dx);
			const arrowLen = 10;
			ctx.beginPath();
			ctx.moveTo(to.x, to.y);
			ctx.lineTo(to.x - arrowLen * Math.cos(angle - Math.PI / 6), to.y - arrowLen * Math.sin(angle - Math.PI / 6));
			ctx.moveTo(to.x, to.y);
			ctx.lineTo(to.x - arrowLen * Math.cos(angle + Math.PI / 6), to.y - arrowLen * Math.sin(angle + Math.PI / 6));
			ctx.stroke();
		});

		Object.keys(nodePositions).forEach((node) => {
			const pos = nodePositions[node];
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, 25, 0, 2 * Math.PI);
			ctx.fillStyle = '#667eea';
			ctx.fill();
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 3;
			ctx.stroke();
			ctx.font = 'bold 12px Arial';
			ctx.fillStyle = '#fff';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(node.substring(0, 3).toUpperCase(), pos.x, pos.y);
		});

		let legendY = 20;
		ctx.font = '14px Arial';
		ctx.textAlign = 'left';
		years.forEach((year) => {
			ctx.fillStyle = colorMap[year];
			ctx.fillRect(10, legendY, 20, 15);
			ctx.fillStyle = '#333';
			ctx.fillText(String(year), 35, legendY + 11);
			legendY += 25;
		});
	}

	return (
		<div>
			<h2 className="text-purple-700 text-2xl font-semibold mb-4 border-b-2 border-indigo-200 pb-2">Assignment History</h2>

			<div className="mb-4">
				<label htmlFor="pool-select" className="block font-semibold mb-1">
					Filter by Pool
				</label>
				<select id="pool-select" value={poolId} onChange={(e) => setPoolId(e.target.value)} className="w-full md:w-1/3 p-2 border rounded">
					<option value="all">All Pools</option>
					{pools.map((p) => (
						<option key={p.id} value={String(p.id)}>
							{p.name}
						</option>
					))}
				</select>
			</div>

			<canvas id="historyCanvas" ref={canvasRef} role="img" aria-label="Assignment History Graph" className="w-full border-2 border-gray-300 rounded-md"></canvas>

			<div className="mt-4">
				<h3 className="text-indigo-600 text-xl font-semibold mb-2">All Chains</h3>
				{chains.length === 0 && <p className="text-gray-500">No history yet</p>}
				<div className="mt-2 text-sm text-gray-700 whitespace-pre-line">{chains.join('\n')}</div>
			</div>
		</div>
	);
}
