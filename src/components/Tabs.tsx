'use client';
import React from 'react';

export default function Tabs({ tabs, active, onChange }: { tabs: { id: string; label: string }[]; active: string; onChange: (id: string) => void }) {
	return (
		<div className="flex gap-2 mb-4 border-b pb-2 overflow-x-auto">
			{tabs.map((t) => (
				<button
					key={t.id}
					onClick={() => onChange(t.id)}
					className={`px-4 py-2 text-sm font-medium transition whitespace-nowrap ${active === t.id ? 'text-indigo-600 font-bold border-b-4 border-indigo-400' : 'text-gray-600 hover:text-indigo-500'}`}
				>
					{t.label}
				</button>
			))}
		</div>
	);
}
