'use client';
import React, { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';
import { EmailConfig } from '@/lib/email-config';

export default function Page() {
	const [config, setConfig] = useState<EmailConfig>({
		smtp_server: '',
		smtp_port: 587,
		smtp_username: '',
		smtp_password: '',
		from_email: '',
	});

	useEffect(() => {
		(async () => {
			try {
				const cfg = await apiGet<EmailConfig>('/api/email-config');
				// Use functional setState to ensure no cascading renders
				setConfig(() => ({
					smtp_server: cfg.smtp_server || '',
					smtp_port: cfg.smtp_port || 587,
					smtp_username: cfg.smtp_username || '',
					smtp_password: cfg.smtp_password || '',
					from_email: cfg.from_email || '',
				}));
			} catch (error) {
				console.error('Failed to load email config', error);
			}
		})();
	}, []); // empty deps array is correct

	const fields = [
		{ label: 'SMTP Server', value: config.smtp_server, type: 'text' },
		{ label: 'SMTP Port', value: config.smtp_port, type: 'number' },
		{ label: 'Username', value: config.smtp_username, type: 'text' },
		{ label: 'Password', value: config.smtp_password, type: 'password' },
		{ label: 'From Email', value: config.from_email, type: 'text' },
	];

	return (
		<div>
			<h2 className="text-purple-700 text-2xl font-semibold mb-4 border-b-2 border-indigo-200 pb-2">Email Configuration</h2>
			<p className="mb-6 text-sm text-gray-700">
				This deployment manages SMTP configuration via environment variables. Fields are read-only. To change settings, update container environment/secrets and redeploy.
			</p>

			<div className="grid md:grid-cols-2 gap-4">
				{fields.map((field) => {
					const id = field.label.replace(/\s+/g, '_').toLowerCase();
					return (
						<div key={field.label}>
							<label htmlFor={id} className="font-semibold block mb-1">
								{field.label}
							</label>
							<input id={id} type={field.type} className="w-full p-2 border rounded bg-gray-100 cursor-not-allowed" value={field.type === 'number' ? (field.value ?? 0) : (field.value ?? '')} readOnly />
						</div>
					);
				})}
			</div>
		</div>
	);
}
